import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { showRootComponent } from "../../common";

import { Page } from "azure-devops-ui/Page";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Card } from "azure-devops-ui/Card";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { Icon } from "azure-devops-ui/Icon";
import { Panel } from "azure-devops-ui/Panel";
import { ContentSize } from "azure-devops-ui/Callout";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { Pill, PillSize } from "azure-devops-ui/Pill";
import { PillGroup } from "azure-devops-ui/PillGroup";
import { MessageBar, MessageBarSeverity } from "azure-devops-ui/MessageBar";
import { VssPersona } from "azure-devops-ui/VssPersona";
import { Ago } from "azure-devops-ui/Ago";
import { AgoFormat } from "azure-devops-ui/Utilities/Date";

import { IGovernedTemplate, ITemplateVersion } from "../../shared/schemas";
import TemplateService from "../../shared/services/template-service";

// ── Category colours ─────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
    "Azure Container Apps": "#0078d4",
    "Azure Functions": "#5c2d91",
    "Azure Kubernetes Service": "#326ce5",
    "Azure Web Apps": "#0078d4",
    "Infrastructure": "#2e7d32",
    "Build": "#e65100",
    "Deploy": "#1565c0",
    "Security": "#c62828",
    "Other": "#888",
};

function categoryColor(cat: string): string {
    return CATEGORY_COLORS[cat] || "#0078d4";
}

const CATEGORY_ICONS: Record<string, string> = {
    "Azure Container Apps": "CloudUpload",
    "Azure Functions": "LightningBolt",
    "Azure Kubernetes Service": "CubeShape",
    "Azure Web Apps": "Globe",
    "Infrastructure": "Settings",
    "Build": "Build",
    "Deploy": "Rocket",
    "Security": "Shield",
    "Other": "FileTemplate",
};

function categoryIconName(cat: string): string {
    return CATEGORY_ICONS[cat] || "FileTemplate";
}

// ── Sub-components ───────────────────────────────────────────────────────
const MetaItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 600, opacity: 0.6 }}>{label}</span>
        <span style={{ fontSize: 13 }}>{value}</span>
    </div>
);

interface TemplateCardProps {
    template: IGovernedTemplate;
    readyVersions: number;
    onClick: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, readyVersions, onClick }) => {
    const color = categoryColor(template.category);
    const iconName = categoryIconName(template.category);

    return (
        <div onClick={onClick} style={{ cursor: "pointer" }}>
            <Card className="bolt-card-no-vertical-padding" contentProps={{ contentPadding: false }}>
                <div style={{
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    height: 200,
                    position: "relative",
                    overflow: "hidden",
                }}>
                    {/* Icon + title */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                        <div style={{
                            width: 44, height: 44,
                            borderRadius: 8,
                            backgroundColor: color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }}>
                            <Icon iconName={iconName} style={{ fontSize: 22, color: "#fff" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {template.name}
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {template.repoName || template.projectName}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div style={{
                        fontSize: 13, lineHeight: 1.5, opacity: 0.8,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                    }}>
                        {template.description || "No description provided"}
                    </div>

                    {/* Footer: category pill + versions */}
                    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{
                            fontSize: 11,
                            padding: "2px 10px",
                            borderRadius: 12,
                            backgroundColor: `${color}22`,
                            color,
                            fontWeight: 600,
                        }}>
                            {template.category || "Uncategorized"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, opacity: 0.7 }}>
                            <Icon iconName="BranchMerge" style={{ fontSize: 13 }} />
                            <span>{readyVersions} version{readyVersions !== 1 ? "s" : ""}</span>
                        </div>
                    </div>

                    {/* Author */}
                    {template.createdBy && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, opacity: 0.6 }}>
                            <VssPersona size={"extra-small" as any} displayName={template.createdBy.displayName} imageUrl={template.createdBy.imageUrl} />
                            <span>{template.createdBy.displayName}</span>
                            {template.lastModifiedOn && (
                                <>
                                    <span style={{ margin: "0 2px" }}>&middot;</span>
                                    <Ago date={new Date(template.lastModifiedOn)} format={AgoFormat.Extended} />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

// ── Main component ───────────────────────────────────────────────────────
const TemplateMarketplace: React.FC = () => {
    const templateService = React.useRef(new TemplateService()).current;
    const [sdkReady, setSdkReady] = React.useState(false);
    const [templates, setTemplates] = React.useState<IGovernedTemplate[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchText, setSearchText] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState("All");

    // Detail panel state
    const [selectedTemplate, setSelectedTemplate] = React.useState<IGovernedTemplate | null>(null);
    const [showDetail, setShowDetail] = React.useState(false);
    const [selectedVersion, setSelectedVersion] = React.useState<ITemplateVersion | null>(null);

    React.useEffect(() => {
        (async () => {
            await SDK.init();
            await SDK.ready();
            setSdkReady(true);
        })();
    }, []);

    React.useEffect(() => {
        if (!sdkReady) return;
        loadTemplates();
    }, [sdkReady]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await templateService.getTemplates();
            setTemplates(data);
        } catch (err) {
            console.error("Failed to load templates:", err);
        } finally {
            setLoading(false);
        }
    };

    // ── Filtering ────────────────────────────────────────────────────────
    const categories = React.useMemo(() => {
        const cats = new Set(templates.map(t => t.category).filter(Boolean));
        return ["All", ...Array.from(cats).sort()];
    }, [templates]);

    const filteredTemplates = React.useMemo(() => {
        return templates.filter(t => {
            const matchesCat = selectedCategory === "All" || t.category === selectedCategory;
            const matchesSearch = !searchText ||
                t.name.toLowerCase().includes(searchText.toLowerCase()) ||
                (t.description || "").toLowerCase().includes(searchText.toLowerCase());
            return matchesCat && matchesSearch;
        });
    }, [templates, selectedCategory, searchText]);

    const readyVersionCount = (t: IGovernedTemplate) =>
        (t.versions || []).filter(v => v.status === "Ready").length;

    // ── Detail panel ─────────────────────────────────────────────────────
    const openDetail = (template: IGovernedTemplate) => {
        setSelectedTemplate(template);
        setShowDetail(true);
        const readyVersions = (template.versions || []).filter(v => v.status === "Ready");
        setSelectedVersion(readyVersions.length > 0 ? readyVersions[0] : null);
    };

    const closeDetail = () => {
        setShowDetail(false);
        setSelectedTemplate(null);
        setSelectedVersion(null);
    };

    // ── Render ───────────────────────────────────────────────────────────
    if (!sdkReady || loading) {
        return (
            <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spinner size={SpinnerSize.large} label="Loading template marketplace..." />
            </div>
        );
    }

    return (
        <Page className="flex-grow">
            {/* Detail panel */}
            {showDetail && selectedTemplate && (
                <Panel
                    onDismiss={closeDetail}
                    size={ContentSize.Large}
                    titleProps={{ text: selectedTemplate.name }}
                    description={selectedTemplate.description || "No description"}
                    footerButtonProps={[{ text: "Close", onClick: closeDetail }]}
                >
                    <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 20 }}>
                        {/* Meta info */}
                        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                            <MetaItem label="Category" value={selectedTemplate.category || "-"} />
                            <MetaItem label="Repository" value={selectedTemplate.repoName || "-"} />
                            <MetaItem label="Project" value={selectedTemplate.projectName || "-"} />
                            {selectedTemplate.createdBy && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    <span style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 600, opacity: 0.6 }}>Published by</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <VssPersona size={"extra-small" as any} displayName={selectedTemplate.createdBy.displayName} imageUrl={selectedTemplate.createdBy.imageUrl} />
                                        <span style={{ fontSize: 13 }}>{selectedTemplate.createdBy.displayName}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: 0 }} />

                        {/* Version picker */}
                        <div>
                            <span style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "block" }}>
                                <Icon iconName="BranchMerge" style={{ marginRight: 6 }} />
                                Select a version
                            </span>
                            {(() => {
                                const readyVersions = (selectedTemplate.versions || []).filter(v => v.status === "Ready");
                                if (readyVersions.length === 0) {
                                    return (
                                        <MessageBar severity={MessageBarSeverity.Info}>
                                            No published versions available for this template.
                                        </MessageBar>
                                    );
                                }
                                const versionItems: IListBoxItem[] = readyVersions.map(v => ({
                                    id: v.versionId || v.objectId,
                                    text: v.tagName?.replace("refs/tags/", "") || v.objectId,
                                }));
                                return (
                                    <Dropdown
                                        placeholder={selectedVersion
                                            ? selectedVersion.tagName?.replace("refs/tags/", "") || "Select version"
                                            : "Select version"}
                                        items={versionItems}
                                        onSelect={(_e, item) => {
                                            const v = readyVersions.find(
                                                rv => (rv.versionId || rv.objectId) === item.id
                                            );
                                            setSelectedVersion(v || null);
                                        }}
                                    />
                                );
                            })()}
                        </div>

                        {/* Usage snippet */}
                        {selectedVersion && (
                            <div>
                                <span style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "block" }}>
                                    <Icon iconName="Code" style={{ marginRight: 6 }} />
                                    Usage
                                </span>
                                <Card>
                                    <pre style={{
                                        margin: 0,
                                        padding: 16,
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                        fontFamily: "Consolas, 'Courier New', monospace",
                                        whiteSpace: "pre-wrap",
                                        wordWrap: "break-word",
                                    }}>
{`resources:
  repositories:
    - repository: templates
      type: git
      name: ${selectedTemplate.projectName}/${selectedTemplate.repoName}
      ref: ${selectedVersion.tagName}

steps:
  - template: ${selectedVersion.templateFilePath || "template.yml"}@templates`}
                                    </pre>
                                </Card>
                            </div>
                        )}
                    </div>
                </Panel>
            )}

            {/* Header */}
            <Header
                title="Template Marketplace (ING)"
                titleSize={TitleSize.Large}
                description="Browse and discover governed pipeline templates"
                commandBarItems={[
                    {
                        id: "refresh",
                        text: "Refresh",
                        iconProps: { iconName: "Refresh" },
                        onActivate: () => { loadTemplates(); },
                        important: true,
                    },
                ]}
            />

            {/* Body */}
            <div className="page-content page-content-top flex-column rhythm-vertical-16" style={{ padding: "0 20px 20px" }}>
                {/* Search + category pills */}
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                    <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 400 }}>
                        <Icon iconName="Search" style={{ position: "absolute", left: 10, top: 9, opacity: 0.5, fontSize: 14 }} />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "7px 12px 7px 32px",
                                borderRadius: 4,
                                border: "1px solid rgba(255,255,255,0.18)",
                                backgroundColor: "rgba(255,255,255,0.06)",
                                color: "inherit",
                                fontSize: 14,
                                outline: "none",
                            }}
                        />
                    </div>
                    <PillGroup>
                        {categories.map(cat => (
                            <Pill
                                key={cat}
                                size={PillSize.compact}
                                onClick={() => setSelectedCategory(cat)}
                                className={selectedCategory === cat ? "selected-pill" : ""}
                            >
                                {cat}
                            </Pill>
                        ))}
                    </PillGroup>
                </div>

                {/* Template grid */}
                {filteredTemplates.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 12, opacity: 0.7 }}>
                        <Icon iconName="SearchIssue" style={{ fontSize: 48 }} />
                        <span style={{ fontSize: 16 }}>No templates found</span>
                        <span style={{ fontSize: 13 }}>Try adjusting your search or filter criteria</span>
                    </div>
                ) : (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                        gap: 16,
                    }}>
                        {filteredTemplates.map(template => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                readyVersions={readyVersionCount(template)}
                                onClick={() => openDetail(template)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Page>
    );
};

showRootComponent(<TemplateMarketplace />);

export default TemplateMarketplace;
