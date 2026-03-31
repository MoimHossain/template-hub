import * as React from "react";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { ZeroData } from "azure-devops-ui/ZeroData";
import { IGovernedTemplate } from "../../../shared/schemas";

interface TemplateListProps {
    templates: IGovernedTemplate[];
    loading: boolean;
    selectedTemplate: IGovernedTemplate | undefined;
    onTemplateSelected: (template: IGovernedTemplate) => void;
    onNewTemplateClicked: () => void;
    onRefreshClicked: () => void;
    onDeleteTemplateClicked: (template: IGovernedTemplate) => void;
    onNewVersionClicked: (template: IGovernedTemplate) => void;
}

const TemplateList: React.FC<TemplateListProps> = (props) => {
    const {
        templates, loading, selectedTemplate,
        onTemplateSelected, onNewTemplateClicked, onRefreshClicked,
        onDeleteTemplateClicked, onNewVersionClicked,
    } = props;

    const commandBarItems: IHeaderCommandBarItem[] = [
        {
            id: "new-template",
            text: "New Template",
            onActivate: onNewTemplateClicked,
            iconProps: { iconName: "Add" },
            important: true,
            isPrimary: true,
        },
        {
            id: "refresh",
            text: "Refresh",
            onActivate: onRefreshClicked,
            iconProps: { iconName: "Refresh" },
            important: true,
        },
    ];

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex-row flex-center justify-center" style={{ padding: 40 }}>
                    <Spinner size={SpinnerSize.large} label="Loading templates..." />
                </div>
            );
        }

        if (!templates || templates.length === 0) {
            return (
                <ZeroData
                    primaryText="No templates registered"
                    secondaryText="Click 'New Template' to register your first governed pipeline template."
                    imagePath=""
                    imageAltText=""
                />
            );
        }

        return (
            <div className="template-list">
                {templates.map((template) => {
                    const isSelected = selectedTemplate?.id === template.id;
                    const versionCount = (template.versions || []).length;
                    return (
                        <div
                            key={template.id}
                            className={`template-list-item ${isSelected ? "selected" : ""}`}
                            onClick={() => onTemplateSelected(template)}
                        >
                            <div className="template-list-item-header">
                                <div className="template-list-item-name">{template.name}</div>
                                <div className="template-list-item-actions">
                                    <button
                                        className="template-action-btn"
                                        title="New Version"
                                        onClick={(e) => { e.stopPropagation(); onNewVersionClicked(template); }}
                                    >
                                        +
                                    </button>
                                    <button
                                        className="template-action-btn danger"
                                        title="Delete"
                                        onClick={(e) => { e.stopPropagation(); onDeleteTemplateClicked(template); }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <div className="template-list-item-meta">
                                <span className="template-category-pill">{template.category}</span>
                                <span className="template-version-count">
                                    {versionCount} version{versionCount !== 1 ? "s" : ""}
                                </span>
                            </div>
                            {template.description && (
                                <div className="template-list-item-desc">{template.description}</div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex-column flex-grow">
            <Header
                title="Governed Templates"
                titleSize={TitleSize.Medium}
                commandBarItems={commandBarItems}
            />
            <div className="flex-column flex-grow v-scroll-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default TemplateList;
