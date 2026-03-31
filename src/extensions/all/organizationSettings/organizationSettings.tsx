import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { showRootComponent } from "../../common";

interface IOrganizationSettingsState {
    ready: boolean;
    extensionContext: string;
}

class OrganizationSettings extends React.Component<{}, IOrganizationSettingsState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            ready: false,
            extensionContext: ""
        };
    }

    public async componentDidMount() {
        try {
            await SDK.init();
            await SDK.ready();
            const extensionContext = SDK.getExtensionContext();
            this.setState({
                ready: true,
                extensionContext: extensionContext.extensionId
            });
        } catch (error) {
            this.setState({ ready: true });
        }
    }

    public render(): JSX.Element {
        return (
            <div className="page-content">
                <h2>Template Hub</h2>
                <p>Organization settings for Template Hub.</p>
                {this.state.ready && (
                    <p style={{ marginTop: 16, color: "#888" }}>
                        Extension loaded successfully.
                    </p>
                )}
            </div>
        );
    }
}

showRootComponent(<OrganizationSettings />);

export default OrganizationSettings;
