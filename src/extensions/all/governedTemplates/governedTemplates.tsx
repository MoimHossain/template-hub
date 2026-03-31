import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { showRootComponent } from "../../common";

import { Splitter, SplitterElementPosition, SplitterDirection } from "azure-devops-ui/Splitter";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { Dialog } from "azure-devops-ui/Dialog";

import { IGovernedTemplate, ITemplateVersion } from "../../shared/schemas";
import TemplateService from "../../shared/services/template-service";
import TemplateList from "./components/template-list";
import TemplateDetails from "./components/template-details";
import NewTemplatePanel from "./components/new-template-panel";
import NewVersionPanel from "./components/new-version-panel";

interface IState {
    sdkReady: boolean;
    loading: boolean;
    collapsed: boolean;
    templates: IGovernedTemplate[];
    selectedTemplate: IGovernedTemplate | undefined;
    showNewTemplatePanel: boolean;
    showNewVersionPanel: boolean;
    showDeleteTemplateDialog: boolean;
    showDeleteVersionDialog: boolean;
    templateToDelete: IGovernedTemplate | null;
    versionToDelete: ITemplateVersion | null;
}

class GovernedTemplatesHub extends React.Component<{}, IState> {
    private templateService = new TemplateService();

    constructor(props: {}) {
        super(props);
        this.state = {
            sdkReady: false,
            loading: true,
            collapsed: false,
            templates: [],
            selectedTemplate: undefined,
            showNewTemplatePanel: false,
            showNewVersionPanel: false,
            showDeleteTemplateDialog: false,
            showDeleteVersionDialog: false,
            templateToDelete: null,
            versionToDelete: null,
        };
    }

    public async componentDidMount() {
        await SDK.init();
        await SDK.ready();
        this.setState({ sdkReady: true });
        await this.loadTemplates();
    }

    private async loadTemplates() {
        this.setState({ loading: true });
        try {
            const templates = await this.templateService.getTemplates();
            const { selectedTemplate } = this.state;
            // Refresh selected template if it still exists
            const refreshed = selectedTemplate
                ? templates.find(t => t.id === selectedTemplate.id)
                : undefined;
            this.setState({ templates, selectedTemplate: refreshed, loading: false });
        } catch (error) {
            console.error("Failed to load templates:", error);
            this.setState({ templates: [], loading: false });
        }
    }

    private handleTemplateSelected = (template: IGovernedTemplate) => {
        this.setState({ selectedTemplate: template });
    };

    private handleNewTemplateClicked = () => {
        this.setState({ showNewTemplatePanel: true });
    };

    private handleNewVersionClicked = () => {
        this.setState({ showNewVersionPanel: true });
    };

    private handleDeleteTemplateClicked = (template: IGovernedTemplate) => {
        this.setState({ showDeleteTemplateDialog: true, templateToDelete: template });
    };

    private handleDeleteVersionClicked = (version: ITemplateVersion) => {
        this.setState({ showDeleteVersionDialog: true, versionToDelete: version });
    };

    private handleToggleVersionStatus = async (version: ITemplateVersion) => {
        const { selectedTemplate } = this.state;
        if (!selectedTemplate) return;
        const newStatus = version.status === "Ready" ? "Blocked" : "Ready";
        const updated = await this.templateService.updateVersionStatus(
            selectedTemplate.id, version.versionId, newStatus
        );
        if (updated) {
            await this.loadTemplates();
        }
    };

    private handleConfirmDeleteTemplate = async () => {
        const { templateToDelete } = this.state;
        if (!templateToDelete) return;
        await this.templateService.deleteTemplate(templateToDelete.id);
        this.setState({
            showDeleteTemplateDialog: false,
            templateToDelete: null,
            selectedTemplate: undefined,
        });
        await this.loadTemplates();
    };

    private handleConfirmDeleteVersion = async () => {
        const { selectedTemplate, versionToDelete } = this.state;
        if (!selectedTemplate || !versionToDelete) return;
        await this.templateService.deleteVersion(selectedTemplate.id, versionToDelete.versionId);
        this.setState({ showDeleteVersionDialog: false, versionToDelete: null });
        await this.loadTemplates();
    };

    private handleTemplatePanelDismiss = (reloadData: boolean) => {
        this.setState({ showNewTemplatePanel: false });
        if (reloadData) {
            this.loadTemplates();
        }
    };

    private handleVersionPanelDismiss = (reloadData: boolean) => {
        this.setState({ showNewVersionPanel: false });
        if (reloadData) {
            this.loadTemplates();
        }
    };

    public render(): JSX.Element {
        const {
            loading, collapsed, templates, selectedTemplate,
            showNewTemplatePanel, showNewVersionPanel,
            showDeleteTemplateDialog, showDeleteVersionDialog,
            templateToDelete, versionToDelete, sdkReady,
        } = this.state;

        if (!sdkReady) {
            return (
                <div className="flex-row flex-center justify-center" style={{ height: "100%" }}>
                    <Spinner size={SpinnerSize.large} label="Initializing..." />
                </div>
            );
        }

        return (
            <div style={{ height: "99%", width: "100%", display: "flex" }}>
                <Splitter
                    collapsed={collapsed}
                    fixedElement={SplitterElementPosition.Near}
                    splitterDirection={SplitterDirection.Vertical}
                    initialFixedSize={650}
                    minFixedSize={400}
                    nearElementClassName="v-scroll-auto custom-scrollbar"
                    farElementClassName="v-scroll-auto custom-scrollbar"
                    onCollapsedChanged={(newCollapsed) => this.setState({ collapsed: newCollapsed })}
                    onRenderNearElement={() => (
                        <TemplateList
                            templates={templates}
                            loading={loading}
                            selectedTemplate={selectedTemplate}
                            onTemplateSelected={this.handleTemplateSelected}
                            onNewTemplateClicked={this.handleNewTemplateClicked}
                            onRefreshClicked={() => this.loadTemplates()}
                            onDeleteTemplateClicked={this.handleDeleteTemplateClicked}
                            onNewVersionClicked={(t) => {
                                this.setState({ selectedTemplate: t });
                                this.handleNewVersionClicked();
                            }}
                        />
                    )}
                    onRenderFarElement={() => (
                        <TemplateDetails
                            template={selectedTemplate}
                            onNewVersionClicked={this.handleNewVersionClicked}
                            onDeleteVersionClicked={this.handleDeleteVersionClicked}
                            onToggleVersionStatus={this.handleToggleVersionStatus}
                        />
                    )}
                />

                {showNewTemplatePanel && (
                    <NewTemplatePanel
                        templateService={this.templateService}
                        onDismiss={this.handleTemplatePanelDismiss}
                    />
                )}

                {showNewVersionPanel && selectedTemplate && (
                    <NewVersionPanel
                        template={selectedTemplate}
                        templateService={this.templateService}
                        onDismiss={this.handleVersionPanelDismiss}
                    />
                )}

                {showDeleteTemplateDialog && templateToDelete && (
                    <Dialog
                        titleProps={{ text: "Delete Template" }}
                        footerButtonProps={[
                            {
                                text: "Cancel",
                                onClick: () => this.setState({ showDeleteTemplateDialog: false, templateToDelete: null }),
                            },
                            {
                                text: "Delete",
                                danger: true,
                                onClick: this.handleConfirmDeleteTemplate,
                            },
                        ]}
                        onDismiss={() => this.setState({ showDeleteTemplateDialog: false, templateToDelete: null })}
                    >
                        <p>
                            Are you sure you want to delete <strong>{templateToDelete.name}</strong>?
                            This will also delete all its versions. This action cannot be undone.
                        </p>
                    </Dialog>
                )}

                {showDeleteVersionDialog && versionToDelete && (
                    <Dialog
                        titleProps={{ text: "Delete Version" }}
                        footerButtonProps={[
                            {
                                text: "Cancel",
                                onClick: () => this.setState({ showDeleteVersionDialog: false, versionToDelete: null }),
                            },
                            {
                                text: "Delete",
                                danger: true,
                                onClick: this.handleConfirmDeleteVersion,
                            },
                        ]}
                        onDismiss={() => this.setState({ showDeleteVersionDialog: false, versionToDelete: null })}
                    >
                        <p>
                            Are you sure you want to delete version <strong>{versionToDelete.tagName.replace("refs/tags/", "")}</strong>?
                            This action cannot be undone.
                        </p>
                    </Dialog>
                )}
            </div>
        );
    }
}

showRootComponent(<GovernedTemplatesHub />);

export default GovernedTemplatesHub;
