import * as React from "react";
import { Dialog } from "azure-devops-ui/Dialog";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { MessageBar, MessageBarSeverity } from "azure-devops-ui/MessageBar";
import { Icon } from "azure-devops-ui/Icon";
import { Ago } from "azure-devops-ui/Ago";
import { AgoFormat } from "azure-devops-ui/Utilities/Date";
import { Table, ISimpleTableCell, ColumnMore, SimpleTableCell } from "azure-devops-ui/Table";
import { ITableColumn, TableColumnLayout } from "azure-devops-ui/Table";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { Button } from "azure-devops-ui/Button";
import { IGovernedTemplate, ITemplateVersion, ITemplateUsage } from "../../../shared/schemas";
import TemplateService from "../../../shared/services/template-service";

interface UsageDialogProps {
    template: IGovernedTemplate;
    version: ITemplateVersion;
    templateService: TemplateService;
    onDismiss: () => void;
}

const UsageDialog: React.FC<UsageDialogProps> = ({ template, version, templateService, onDismiss }) => {
    const [loading, setLoading] = React.useState(true);
    const [usageData, setUsageData] = React.useState<ITemplateUsage[]>([]);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        (async () => {
            try {
                const data = await templateService.getVersionUsage(template.id, version.versionId);
                setUsageData(data);
            } catch (err) {
                setError("Failed to load usage data.");
            } finally {
                setLoading(false);
            }
        })();
    }, [template.id, version.versionId]);

    const tagDisplay = version.tagName.replace("refs/tags/", "");

    const columns: ITableColumn<ITemplateUsage>[] = [
        {
            id: "pipelineName",
            name: "Pipeline",
            width: -40,
            renderCell: (rowIndex, columnIndex, tableColumn, item) => (
                <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                        <Icon iconName="Build" style={{ fontSize: 14, flexShrink: 0 }} />
                        <span className="text-ellipsis" title={item.pipelineName}>{item.pipelineName}</span>
                    </div>
                </SimpleTableCell>
            ),
        },
        {
            id: "projectName",
            name: "Project",
            width: -20,
            renderCell: (rowIndex, columnIndex, tableColumn, item) => (
                <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn}>
                    <span className="text-ellipsis" title={item.projectName}>{item.projectName}</span>
                </SimpleTableCell>
            ),
        },
        {
            id: "buildId",
            name: "Last Build",
            width: -15,
            renderCell: (rowIndex, columnIndex, tableColumn, item) => (
                <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn}>
                    <span style={{ fontFamily: "Consolas, monospace", fontSize: 12 }}>
                        #{item.buildId}
                    </span>
                </SimpleTableCell>
            ),
        },
        {
            id: "lastRunOn",
            name: "Last Used",
            width: -15,
            renderCell: (rowIndex, columnIndex, tableColumn, item) => (
                <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn}>
                    {item.lastRunOn && (
                        <Ago date={new Date(item.lastRunOn)} format={AgoFormat.Extended} />
                    )}
                </SimpleTableCell>
            ),
        },
        {
            id: "action",
            name: "",
            width: 50,
            renderCell: (rowIndex, columnIndex, tableColumn, item) => {
                const buildUrl = `https://dev.azure.com/${item.orgName}/${item.projectId}/_build/results?buildId=${item.buildId}&view=results`;
                return (
                    <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn}>
                        <Button
                            iconProps={{ iconName: "NavigateExternalInline" }}
                            subtle={true}
                            onClick={() => window.open(buildUrl, "_blank")}
                            tooltipProps={{ text: "Go to build" }}
                        />
                    </SimpleTableCell>
                );
            },
        },
    ];

    const itemProvider = new ArrayItemProvider<ITemplateUsage>(usageData);

    return (
        <Dialog
            titleProps={{ text: `Usage: ${tagDisplay}` }}
            onDismiss={onDismiss}
            footerButtonProps={[{ text: "Close", onClick: onDismiss }]}
            contentSize={{ width: 700, height: 500 } as any}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 200 }}>
                <MessageBar severity={MessageBarSeverity.Info}>
                    Pipelines that reference <strong>{template.name}</strong> version <strong>{tagDisplay}</strong>.
                    Data is collected automatically by the Template Hub decorator during pipeline runs.
                </MessageBar>

                {loading && (
                    <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                        <Spinner size={SpinnerSize.large} label="Loading usage data..." />
                    </div>
                )}

                {error && (
                    <MessageBar severity={MessageBarSeverity.Error}>{error}</MessageBar>
                )}

                {!loading && !error && usageData.length === 0 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 32, opacity: 0.7 }}>
                        <Icon iconName="BuildQueue" style={{ fontSize: 40 }} />
                        <span style={{ fontSize: 14 }}>No pipeline usage recorded yet</span>
                        <span style={{ fontSize: 12 }}>
                            Usage will appear here after pipelines referencing this version have run.
                        </span>
                    </div>
                )}

                {!loading && usageData.length > 0 && (
                    <>
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                            {usageData.length} pipeline{usageData.length !== 1 ? "s" : ""} using this version
                        </span>
                        <Table<ITemplateUsage>
                            columns={columns}
                            itemProvider={itemProvider}
                            role="table"
                        />
                    </>
                )}
            </div>
        </Dialog>
    );
};

export default UsageDialog;
