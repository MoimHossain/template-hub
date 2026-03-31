import * as React from "react";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { ZeroData } from "azure-devops-ui/ZeroData";
import {
    ColumnMore,
    Table,
    TwoLineTableCell,
    SimpleTableCell,
    ITableColumn,
    TableColumnLayout,
} from "azure-devops-ui/Table";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { Pill, PillSize, PillVariant } from "azure-devops-ui/Pill";
import { ListSelection } from "azure-devops-ui/List";
import { Card } from "azure-devops-ui/Card";
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

    const selectionRef = React.useRef(new ListSelection({ selectOnFocus: false }));
    const selection = selectionRef.current;

    const itemProvider = React.useMemo(
        () => new ArrayItemProvider<IGovernedTemplate>(templates),
        [templates]
    );

    // Sync table selection with external selectedTemplate prop
    React.useEffect(() => {
        if (selectedTemplate && templates.length > 0) {
            const index = templates.findIndex(t => t.id === selectedTemplate.id);
            if (index >= 0) {
                selection.select(index);
            }
        }
    }, [selectedTemplate, templates]);

    const moreColumn = new ColumnMore<IGovernedTemplate>((item) => ({
        id: `template-menu-${item.id}`,
        items: [
            {
                id: "new-version",
                text: "New Version",
                iconProps: { iconName: "Add" },
                onActivate: () => onNewVersionClicked(item),
            },
            {
                id: "delete",
                text: "Delete",
                iconProps: { iconName: "Delete" },
                onActivate: () => onDeleteTemplateClicked(item),
            },
        ],
    }));

    const columns: ITableColumn<IGovernedTemplate>[] = [
        {
            id: "name",
            name: "Template",
            width: -100,
            columnLayout: TableColumnLayout.twoLine,
            renderCell: (rowIndex, columnIndex, tableColumn, item) => (
                <TwoLineTableCell
                    columnIndex={columnIndex}
                    tableColumn={tableColumn}
                    line1={
                        <span className="fontWeightSemiBold font-weight-semibold text-ellipsis">
                            {item.name}
                        </span>
                    }
                    line2={
                        <span className="fontSize font-size secondary-text text-ellipsis">
                            {item.description || "No description"}
                        </span>
                    }
                />
            ),
        },
        {
            id: "category",
            name: "Category",
            width: 160,
            renderCell: (rowIndex, columnIndex, tableColumn, item) => (
                <SimpleTableCell columnIndex={columnIndex} tableColumn={tableColumn}>
                    <Pill size={PillSize.compact} variant={PillVariant.outlined}>
                        {item.category}
                    </Pill>
                </SimpleTableCell>
            ),
        },
        moreColumn,
    ];

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
            <Table
                columns={columns}
                itemProvider={itemProvider}
                showHeader={false}
                selection={selection}
                singleClickActivation={true}
                onActivate={(event, row) => {
                    onTemplateSelected(templates[row.index]);
                }}
            />
        );
    };

    return (
        <div className="flex-column flex-grow">
            <Header
                title="One Template (ING)"
                titleSize={TitleSize.Medium}
                commandBarItems={commandBarItems}
            />
            <div className="flex-column flex-grow v-scroll-auto" style={{ padding: "8px 16px" }}>
                <Card className="flex-grow">
                    {renderContent()}
                </Card>
            </div>
        </div>
    );
};

export default TemplateList;
