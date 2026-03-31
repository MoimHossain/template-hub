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
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { PillGroup } from "azure-devops-ui/PillGroup";
import TemplateService from "../../../shared/services/template-service";

interface NewTemplatePanelProps {
    templateService: TemplateService;
    onDismiss: (reloadData: boolean) => void;
}

interface IState {
    name: string;
    description: string;
    category: string;
    repositoryId: string;
    repoName: string;
    projectId: string;
    projectName: string;
    repos: Array<{ id: string; name: string }>;
    archetypes: string[];
    loadingRepos: boolean;
    saving: boolean;
    error: string;
}

class NewTemplatePanel extends React.Component<NewTemplatePanelProps, IState> {
    private repoSelection = new DropdownSelection();

    constructor(props: NewTemplatePanelProps) {
        super(props);
        this.state = {
            name: "",
            description: "",
            category: "",
            repositoryId: "",
            repoName: "",
            projectId: "",
            projectName: "",
            repos: [],
            archetypes: [],
            loadingRepos: true,
            saving: false,
            error: "",
        };
    }

    public async componentDidMount() {
        try {
            const [project, archetypes] = await Promise.all([
                this.props.templateService.getCurrentProjectInfo(),
                this.props.templateService.getArchetypes(),
            ]);
            this.setState({ archetypes });
            if (project) {
                const repos = await this.props.templateService.getRepositories(project.id);
                this.setState({
                    projectId: project.id,
                    projectName: project.name,
                    repos,
                    loadingRepos: false,
                });
            } else {
                this.setState({ loadingRepos: false, error: "Could not determine current project." });
            }
        } catch (error) {
            this.setState({ loadingRepos: false, error: "Failed to load data." });
        }
    }

    private isValid(): boolean {
        const { name, repositoryId, category, saving } = this.state;
        return name.trim().length > 0 && repositoryId.length > 0 && category.trim().length > 0 && !saving;
    }

    private handleCreate = async () => {
        if (!this.isValid()) return;
        this.setState({ saving: true, error: "" });
        try {
            const { name, description, category, repositoryId, repoName, projectId, projectName } = this.state;
            const trimmedCategory = category.trim();
            // Save new archetype if it doesn't exist yet
            await this.props.templateService.addArchetype(trimmedCategory);
            await this.props.templateService.createTemplate(
                name.trim(), description.trim(), trimmedCategory,
                repositoryId, repoName, projectId, projectName
            );
            this.props.onDismiss(true);
        } catch (error) {
            this.setState({ saving: false, error: "Failed to create template." });
        }
    };

    private renderArchetypeSuggestions(): JSX.Element | null {
        const { archetypes, category } = this.state;
        const filtered = category.trim()
            ? archetypes.filter(a => a.toLowerCase().includes(category.toLowerCase()))
            : archetypes;

        if (filtered.length === 0) return null;

        return (
            <PillGroup>
                {filtered.map(a => (
                    <Pill
                        key={a}
                        size={PillSize.compact}
                        variant={a === category ? PillVariant.colored : PillVariant.outlined}
                        onClick={() => this.setState({ category: a })}
                    >
                        {a}
                    </Pill>
                ))}
            </PillGroup>
        );
    }

    public render(): JSX.Element {
        const { name, description, repos, loadingRepos, saving, error, category } = this.state;
        const repoItems: IListBoxItem[] = repos.map(r => ({ id: r.id, text: r.name }));

        return (
            <Panel
                onDismiss={() => this.props.onDismiss(false)}
                titleProps={{ text: "New Governed Template" }}
                description="Register a pipeline template repository"
                size={ContentSize.Large}
                footerButtonProps={[
                    { text: "Cancel", onClick: () => this.props.onDismiss(false) },
                    { text: "Create", primary: true, onClick: this.handleCreate, disabled: !this.isValid() },
                ]}
            >
                <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                    {error && (
                        <MessageBar severity={MessageBarSeverity.Error}>{error}</MessageBar>
                    )}

                    <FormItem label="Name *">
                        <TextField
                            value={name}
                            onChange={(_, val) => this.setState({ name: val })}
                            placeholder="Enter template name"
                            width={TextFieldWidth.standard}
                        />
                    </FormItem>

                    <FormItem label="Description">
                        <TextField
                            value={description}
                            onChange={(_, val) => this.setState({ description: val })}
                            placeholder="Brief description of the template"
                            multiline={true}
                            rows={3}
                            width={TextFieldWidth.standard}
                        />
                    </FormItem>

                    <FormItem label="Archetype *" message="Select an existing archetype or type a new one">
                        <TextField
                            value={category}
                            onChange={(_, val) => this.setState({ category: val })}
                            placeholder="Type or select an archetype"
                            width={TextFieldWidth.standard}
                        />
                        <div style={{ marginTop: 8 }}>
                            {this.renderArchetypeSuggestions()}
                        </div>
                    </FormItem>

                    <FormItem label="Repository *">
                        {loadingRepos ? (
                            <Spinner size={SpinnerSize.small} label="Loading repositories..." />
                        ) : (
                            <Dropdown
                                items={repoItems}
                                selection={this.repoSelection}
                                placeholder="Select a repository"
                                className="flex-grow"
                                onSelect={(_, item) => {
                                    const repo = repos.find(r => r.id === item.id);
                                    this.setState({
                                        repositoryId: item.id!,
                                        repoName: repo ? repo.name : "",
                                    });
                                }}
                            />
                        )}
                    </FormItem>

                    {saving && (
                        <Spinner size={SpinnerSize.small} label="Creating template..." />
                    )}
                </div>
            </Panel>
        );
    }
}

export default NewTemplatePanel;
