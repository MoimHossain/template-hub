import * as React from "react";
import { Panel } from "azure-devops-ui/Panel";
import { ContentSize } from "azure-devops-ui/Callout";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { MessageBar, MessageBarSeverity } from "azure-devops-ui/MessageBar";
import { FormItem } from "azure-devops-ui/FormItem";
import { IGovernedTemplate, IGitTag } from "../../../shared/schemas";
import TemplateService from "../../../shared/services/template-service";

interface NewVersionPanelProps {
    template: IGovernedTemplate;
    templateService: TemplateService;
    onDismiss: (reloadData: boolean) => void;
}

interface IState {
    tags: IGitTag[];
    selectedTag: IGitTag | null;
    templateFilePath: string;
    helpUrl: string;
    loadingTags: boolean;
    saving: boolean;
    error: string;
}

class NewVersionPanel extends React.Component<NewVersionPanelProps, IState> {
    private tagSelection = new DropdownSelection();

    constructor(props: NewVersionPanelProps) {
        super(props);
        this.state = {
            tags: [],
            selectedTag: null,
            templateFilePath: "",
            helpUrl: "",
            loadingTags: true,
            saving: false,
            error: "",
        };
    }

    public async componentDidMount() {
        try {
            const { template, templateService } = this.props;
            const tags = await templateService.getRepositoryTags(
                template.repositoryId, template.projectId
            );
            this.setState({ tags, loadingTags: false });
        } catch (error) {
            this.setState({ loadingTags: false, error: "Failed to load Git tags." });
        }
    }

    private isValid(): boolean {
        return this.state.selectedTag !== null && !this.state.saving;
    }

    private handleCreate = async () => {
        const { selectedTag, templateFilePath, helpUrl } = this.state;
        if (!selectedTag) return;

        this.setState({ saving: true, error: "" });
        try {
            await this.props.templateService.addVersion(
                this.props.template.id,
                selectedTag.name,
                selectedTag.objectId,
                selectedTag.peeledObjectId,
                templateFilePath.trim(),
                helpUrl.trim()
            );
            this.props.onDismiss(true);
        } catch (error) {
            this.setState({ saving: false, error: "Failed to create version." });
        }
    };

    public render(): JSX.Element {
        const { template } = this.props;
        const { tags, selectedTag, templateFilePath, helpUrl, loadingTags, saving, error } = this.state;

        const tagItems: IListBoxItem[] = tags.map(t => ({
            id: t.name,
            text: t.name.replace("refs/tags/", ""),
        }));

        return (
            <Panel
                onDismiss={() => this.props.onDismiss(false)}
                titleProps={{ text: "New Version" }}
                description={`Publish a new version for ${template.name}`}
                size={ContentSize.Large}
                footerButtonProps={[
                    { text: "Cancel", onClick: () => this.props.onDismiss(false) },
                    { text: "Publish", primary: true, onClick: this.handleCreate, disabled: !this.isValid() },
                ]}
            >
                <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                    {error && (
                        <MessageBar severity={MessageBarSeverity.Error}>{error}</MessageBar>
                    )}

                    <MessageBar severity={MessageBarSeverity.Info}>
                        Repository: <strong>{template.repoName}</strong> ({template.projectName})
                    </MessageBar>

                    <FormItem label="Select Tag *">
                        {loadingTags ? (
                            <Spinner size={SpinnerSize.small} label="Loading tags..." />
                        ) : tags.length === 0 ? (
                            <MessageBar severity={MessageBarSeverity.Warning}>
                                No tags found in this repository. Create a Git tag first.
                            </MessageBar>
                        ) : (
                            <Dropdown
                                items={tagItems}
                                selection={this.tagSelection}
                                placeholder="Select a Git tag"
                                className="flex-grow"
                                onSelect={(_, item) => {
                                    const tag = tags.find(t => t.name === item.id);
                                    this.setState({ selectedTag: tag || null });
                                }}
                            />
                        )}
                    </FormItem>

                    {selectedTag && (
                        <div className="selected-tag-info">
                            <span className="text-muted">
                                Tag: {selectedTag.name.replace("refs/tags/", "")} •
                                Commit: {selectedTag.objectId.substring(0, 8)}
                            </span>
                        </div>
                    )}

                    <FormItem label="Template File Path">
                        <TextField
                            value={templateFilePath}
                            onChange={(_, val) => this.setState({ templateFilePath: val })}
                            placeholder="/templates/template.yml"
                            width={TextFieldWidth.standard}
                        />
                    </FormItem>

                    <FormItem label="Help URL">
                        <TextField
                            value={helpUrl}
                            onChange={(_, val) => this.setState({ helpUrl: val })}
                            placeholder="https://docs.example.com/template-guide"
                            width={TextFieldWidth.standard}
                        />
                    </FormItem>

                    {saving && (
                        <Spinner size={SpinnerSize.small} label="Publishing version..." />
                    )}
                </div>
            </Panel>
        );
    }
}

export default NewVersionPanel;
