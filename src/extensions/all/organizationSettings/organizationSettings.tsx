import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { showRootComponent } from "../../common";
import { isCurrentUserPCA } from "../../shared/identity-utils";

import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";
import { Page } from "azure-devops-ui/Page";
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { ZeroData, ZeroDataActionType } from "azure-devops-ui/ZeroData";
import { MessageBar, MessageBarSeverity } from "azure-devops-ui/MessageBar";

interface IOrganizationSettingsState {
    loading: boolean;
    isPCA: boolean;
    error: string | undefined;
}

class OrganizationSettings extends React.Component<{}, IOrganizationSettingsState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            loading: true,
            isPCA: false,
            error: undefined
        };
    }

    public async componentDidMount() {
        try {
            await SDK.init();
            await SDK.ready();

            const isPCA = await isCurrentUserPCA();
            this.setState({ loading: false, isPCA });
        } catch (error) {
            console.error("Initialization error:", error);
            this.setState({
                loading: false,
                error: "Failed to verify your permissions. Please try refreshing the page."
            });
        }
    }

    private renderLoading(): JSX.Element {
        return (
            <div className="flex-row flex-center justify-center" style={{ height: "100%", width: "100%" }}>
                <Spinner size={SpinnerSize.large} label="Verifying permissions..." />
            </div>
        );
    }

    private renderAccessDenied(): JSX.Element {
        return (
            <div className="flex-column flex-center justify-center" style={{ height: "100%", width: "100%" }}>
                <ZeroData
                    primaryText="Access Restricted"
                    secondaryText={
                        <span>
                            You must be a <strong>Project Collection Administrator</strong> to
                            configure Template Hub settings. Please contact your organization
                            administrator to request access.
                        </span>
                    }
                    imagePath=""
                    imageAltText=""
                    actionText="Learn more about permissions"
                    actionType={ZeroDataActionType.ctaButton}
                    onActionClick={() => {
                        window.open(
                            "https://learn.microsoft.com/en-us/azure/devops/organizations/security/look-up-project-collection-administrators",
                            "_blank"
                        );
                    }}
                />
            </div>
        );
    }

    private renderSettings(): JSX.Element {
        return (
            <div className="page-content flex-column">
                <MessageBar severity={MessageBarSeverity.Info}>
                    Template Hub organization settings will be available here soon.
                </MessageBar>
            </div>
        );
    }

    public render(): JSX.Element {
        const { loading, isPCA, error } = this.state;

        return (
            <Surface background={SurfaceBackground.neutral}>
                <Page className="flex-column flex-grow">
                    <Header
                        title="Template Hub"
                        titleSize={TitleSize.Large}
                    />
                    <div className="page-content-top flex-column flex-grow">
                        {error && (
                            <MessageBar severity={MessageBarSeverity.Error}>
                                {error}
                            </MessageBar>
                        )}
                        {loading
                            ? this.renderLoading()
                            : isPCA
                                ? this.renderSettings()
                                : this.renderAccessDenied()
                        }
                    </div>
                </Page>
            </Surface>
        );
    }
}

showRootComponent(<OrganizationSettings />);

export default OrganizationSettings;
