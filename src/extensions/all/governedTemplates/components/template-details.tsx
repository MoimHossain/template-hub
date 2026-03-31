import * as React from "react";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { Tab, TabBar, TabSize } from "azure-devops-ui/Tabs";
import { Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { Ago } from "azure-devops-ui/Ago";
import { AgoFormat } from "azure-devops-ui/Utilities/Date";
import { ZeroData } from "azure-devops-ui/ZeroData";
import { IGovernedTemplate, ITemplateVersion } from "../../../shared/schemas";

const TAB_GENERAL = "general";
const TAB_VERSIONS = "versions";

interface TemplateDetailsProps {
    template: IGovernedTemplate | undefined;
    onNewVersionClicked: () => void;
    onDeleteVersionClicked: (version: ITemplateVersion) => void;
    onToggleVersionStatus: (version: ITemplateVersion) => void;
}

const TemplateDetails: React.FC<TemplateDetailsProps> = (props) => {
    const { template, onNewVersionClicked, onDeleteVersionClicked, onToggleVersionStatus } = props;
    const [selectedTab, setSelectedTab] = React.useState<string>(TAB_GENERAL);

    if (!template) {
        return (
            <div className="flex-column flex-center justify-center" style={{ height: "100%", padding: 40 }}>
                <ZeroData
                    primaryText="Select a template"
                    secondaryText="Choose a template from the list to view its details and versions."
                    imagePath=""
                    imageAltText=""
                />
            </div>
        );
    }

    const commandBarItems: IHeaderCommandBarItem[] = [
        {
            id: "new-version",
            text: "New Version",
            onActivate: onNewVersionClicked,
            iconProps: { iconName: "Add" },
            important: true,
            isPrimary: true,
        },
    ];

    const renderGeneralTab = () => (
        <div className="template-details-section">
            <table className="template-property-table">
                <tbody>
                    <tr>
                        <td className="property-label">Name</td>
                        <td className="property-value">{template.name}</td>
                    </tr>
                    <tr>
                        <td className="property-label">Description</td>
                        <td className="property-value">{template.description || "—"}</td>
                    </tr>
                    <tr>
                        <td className="property-label">Category</td>
                        <td className="property-value">
                            <span className="template-category-pill">{template.category}</span>
                        </td>
                    </tr>
                    <tr>
                        <td className="property-label">Repository</td>
                        <td className="property-value">{template.repoName} ({template.projectName})</td>
                    </tr>
                    <tr>
                        <td className="property-label">Created By</td>
                        <td className="property-value">
                            <div className="user-info">
                                {template.createdBy?.imageUrl && (
                                    <img className="user-avatar" src={template.createdBy.imageUrl} alt="" />
                                )}
                                <span>{template.createdBy?.displayName}</span>
                                {template.createdOn && (
                                    <span className="text-muted" style={{ marginLeft: 8 }}>
                                        <Ago date={new Date(template.createdOn)} format={AgoFormat.Extended} />
                                    </span>
                                )}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="property-label">Last Modified</td>
                        <td className="property-value">
                            <div className="user-info">
                                {template.lastModifiedBy?.imageUrl && (
                                    <img className="user-avatar" src={template.lastModifiedBy.imageUrl} alt="" />
                                )}
                                <span>{template.lastModifiedBy?.displayName}</span>
                                {template.lastModifiedOn && (
                                    <span className="text-muted" style={{ marginLeft: 8 }}>
                                        <Ago date={new Date(template.lastModifiedOn)} format={AgoFormat.Extended} />
                                    </span>
                                )}
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );

    const renderVersionsTab = () => {
        const versions = template.versions || [];

        if (versions.length === 0) {
            return (
                <ZeroData
                    primaryText="No versions published"
                    secondaryText="Click 'New Version' to publish a version from a Git tag."
                    imagePath=""
                    imageAltText=""
                />
            );
        }

        return (
            <div className="template-details-section">
                <table className="template-versions-table">
                    <thead>
                        <tr>
                            <th>Tag</th>
                            <th>Status</th>
                            <th>Published By</th>
                            <th>Published On</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {versions.map((version) => (
                            <tr key={version.versionId}>
                                <td className="version-tag-name">
                                    {version.tagName.replace("refs/tags/", "")}
                                </td>
                                <td>
                                    <Status
                                        {...(version.status === "Ready" ? Statuses.Success : Statuses.Failed)}
                                        size={StatusSize.m}
                                    />
                                    <span style={{ marginLeft: 6 }}>{version.status}</span>
                                </td>
                                <td>
                                    <div className="user-info">
                                        {version.publishedBy?.imageUrl && (
                                            <img className="user-avatar" src={version.publishedBy.imageUrl} alt="" />
                                        )}
                                        <span>{version.publishedBy?.displayName}</span>
                                    </div>
                                </td>
                                <td>
                                    {version.publishedOn && (
                                        <Ago date={new Date(version.publishedOn)} format={AgoFormat.Extended} />
                                    )}
                                </td>
                                <td>
                                    <div className="version-actions">
                                        <button
                                            className="template-action-btn"
                                            title={version.status === "Ready" ? "Block" : "Unblock"}
                                            onClick={() => onToggleVersionStatus(version)}
                                        >
                                            {version.status === "Ready" ? "⊘" : "✓"}
                                        </button>
                                        <button
                                            className="template-action-btn danger"
                                            title="Delete"
                                            onClick={() => onDeleteVersionClicked(version)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="flex-column flex-grow">
            <Header
                title={template.name}
                titleSize={TitleSize.Medium}
                commandBarItems={commandBarItems}
            />
            <TabBar
                selectedTabId={selectedTab}
                onSelectedTabChanged={(newTabId) => setSelectedTab(newTabId)}
                tabSize={TabSize.Tall}
            >
                <Tab id={TAB_GENERAL} name="General" />
                <Tab id={TAB_VERSIONS} name={`Versions (${(template.versions || []).length})`} />
            </TabBar>
            <div className="flex-column flex-grow v-scroll-auto" style={{ padding: 16 }}>
                {selectedTab === TAB_GENERAL ? renderGeneralTab() : renderVersionsTab()}
            </div>
        </div>
    );
};

export default TemplateDetails;
