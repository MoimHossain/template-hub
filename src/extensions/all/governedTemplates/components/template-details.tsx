import * as React from "react";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { Tab, TabBar, TabSize } from "azure-devops-ui/Tabs";
import { Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { Ago } from "azure-devops-ui/Ago";
import { AgoFormat } from "azure-devops-ui/Utilities/Date";
import { ZeroData } from "azure-devops-ui/ZeroData";
import { Table, renderSimpleCell, ISimpleTableCell, ColumnMore, TableColumnLayout } from "azure-devops-ui/Table";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { ITableColumn } from "azure-devops-ui/Table";
import { Card } from "azure-devops-ui/Card";
import { IGovernedTemplate, ITemplateVersion } from "../../../shared/schemas";

const TAB_GENERAL = "general";
const TAB_VERSIONS = "versions";

interface TemplateDetailsProps {
    template: IGovernedTemplate | undefined;
    onNewVersionClicked: () => void;
    onDeleteVersionClicked: (version: ITemplateVersion) => void;
    onToggleVersionStatus: (version: ITemplateVersion) => void;
}

interface IVersionTableItem extends ISimpleTableCell {
    tagName: string;
    status: string;
    publishedBy: string;
    publishedOn: string;
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
                        <td className="property-label">Archetype</td>
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

        const versionItems: IVersionTableItem[] = versions.map(v => ({
            tagName: v.tagName.replace("refs/tags/", ""),
            status: v.status,
            publishedBy: v.publishedBy?.displayName || "",
            publishedOn: v.publishedOn || "",
        }));

        const itemProvider = new ArrayItemProvider<IVersionTableItem>(versionItems);

        const moreColumn = new ColumnMore<IVersionTableItem>((item, rowIndex) => {
            const version = versions[rowIndex];
            return {
                id: `version-menu-${rowIndex}`,
                items: [
                    {
                        id: "toggle-status",
                        text: version.status === "Ready" ? "Block Version" : "Unblock Version",
                        iconProps: { iconName: version.status === "Ready" ? "BlockedSolid" : "Accept" },
                        onActivate: () => onToggleVersionStatus(version),
                    },
                    {
                        id: "delete",
                        text: "Delete Version",
                        iconProps: { iconName: "Delete" },
                        onActivate: () => onDeleteVersionClicked(version),
                    },
                ],
            };
        });

        const columns: Array<ITableColumn<IVersionTableItem>> = [
            {
                id: "tagName",
                name: "Tag",
                width: -40,
                columnLayout: TableColumnLayout.singleLinePrefix,
                renderCell: (rowIndex, columnIndex, tableColumn, tableItem) => {
                    return renderSimpleCell(rowIndex, columnIndex, tableColumn, tableItem);
                },
            },
            {
                id: "status",
                name: "Status",
                width: -20,
                renderCell: (_rowIndex, _columnIndex, _tableColumn, tableItem) => {
                    return (
                        <td className="bolt-table-cell" key="status">
                            <div className="flex-row flex-center" style={{ gap: 6 }}>
                                <Status
                                    {...(tableItem.status === "Ready" ? Statuses.Success : Statuses.Failed)}
                                    size={StatusSize.m}
                                />
                                <span>{tableItem.status}</span>
                            </div>
                        </td>
                    );
                },
            },
            {
                id: "publishedBy",
                name: "Published By",
                width: -25,
                renderCell: renderSimpleCell,
            },
            {
                id: "publishedOn",
                name: "Published On",
                width: -15,
                renderCell: (_rowIndex, _columnIndex, _tableColumn, tableItem) => {
                    return (
                        <td className="bolt-table-cell" key="publishedOn">
                            {tableItem.publishedOn && (
                                <Ago date={new Date(tableItem.publishedOn)} format={AgoFormat.Extended} />
                            )}
                        </td>
                    );
                },
            },
            moreColumn,
        ];

        return (
            <div className="template-details-section">
                <Table<IVersionTableItem>
                    columns={columns}
                    itemProvider={itemProvider}
                    role="table"
                />
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
            <div className="flex-column flex-grow v-scroll-auto" style={{ padding: "8px 16px" }}>
                <Card className="flex-grow">
                    {selectedTab === TAB_GENERAL ? renderGeneralTab() : renderVersionsTab()}
                </Card>
            </div>
        </div>
    );
};

export default TemplateDetails;
