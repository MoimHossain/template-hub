import * as SDK from "azure-devops-extension-sdk";
import { getClient } from "azure-devops-extension-api";
import { GraphRestClient, GraphTraversalDirection } from "azure-devops-extension-api/Graph";

const PCA_GROUP_DISPLAYNAME = "Project Collection Administrators";

export async function isCurrentUserPCA(): Promise<boolean> {
    try {
        const graphClient = getClient(GraphRestClient);
        const user = SDK.getUser();

        // Convert the user's storage key (GUID) to a subject descriptor
        const descriptorResult = await graphClient.getDescriptor(user.id);
        const userDescriptor = descriptorResult.value;

        // List all groups the user is a direct member of (upward direction)
        const memberships = await graphClient.listMemberships(
            userDescriptor, GraphTraversalDirection.Up, 1
        );

        if (!memberships || memberships.length === 0) {
            return false;
        }

        // Resolve the container descriptors to find if any is the PCA group
        const containerDescriptors = memberships.map(m => m.containerDescriptor);

        // Batch-lookup all container subjects
        const subjects = await graphClient.lookupSubjects({
            lookupKeys: containerDescriptors.map(d => ({ descriptor: d }))
        });

        if (!subjects) {
            return false;
        }

        // Check if any resolved group is the PCA group
        for (const key of Object.keys(subjects)) {
            const subject = subjects[key];
            if (subject && subject.displayName === PCA_GROUP_DISPLAYNAME) {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error("Failed to check PCA membership:", error);
        return false;
    }
}
