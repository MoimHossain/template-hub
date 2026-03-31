import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, getClient, IProjectPageService } from "azure-devops-extension-api";
import { GraphRestClient, GraphTraversalDirection } from "azure-devops-extension-api/Graph";

const PCA_GROUP_DISPLAYNAME = "Project Collection Administrators";
const PA_GROUP_DISPLAYNAME = "Project Administrators";

export interface IUserAuthorization {
    isPCA: boolean;
    isPA: boolean;
    isAuthorized: boolean;
}

/**
 * Resolves all direct group memberships for the current user and returns
 * an authorization result indicating PCA and/or PA membership.
 * PA check is scoped to the current project by matching principalName.
 */
export async function checkUserAuthorization(): Promise<IUserAuthorization> {
    const result: IUserAuthorization = { isPCA: false, isPA: false, isAuthorized: false };

    try {
        const graphClient = getClient(GraphRestClient);
        const user = SDK.getUser();

        // Get current project name for scoping the PA check
        const projectService = await SDK.getService<IProjectPageService>(
            CommonServiceIds.ProjectPageService
        );
        const project = await projectService.getProject();
        const projectName = project?.name || "";

        // Convert user storage key to a subject descriptor
        const descriptorResult = await graphClient.getDescriptor(user.id);
        const userDescriptor = descriptorResult.value;

        // List all groups the user is a direct member of (upward)
        const memberships = await graphClient.listMemberships(
            userDescriptor, GraphTraversalDirection.Up, 1
        );

        if (!memberships || memberships.length === 0) {
            return result;
        }

        const containerDescriptors = memberships.map(m => m.containerDescriptor);

        // Batch-lookup all container subjects
        const subjects = await graphClient.lookupSubjects({
            lookupKeys: containerDescriptors.map(d => ({ descriptor: d }))
        });

        if (!subjects) {
            return result;
        }

        for (const key of Object.keys(subjects)) {
            const subject = subjects[key];
            if (!subject) continue;

            // PCA check: org-scoped group
            if (subject.displayName === PCA_GROUP_DISPLAYNAME) {
                result.isPCA = true;
            }

            // PA check: must match current project
            // For groups, principalName is "[ProjectName]\Project Administrators"
            if (subject.displayName === PA_GROUP_DISPLAYNAME && projectName) {
                const principalName = (subject as any).principalName as string | undefined;
                if (
                    principalName &&
                    principalName.toLowerCase() === `[${projectName}]\\${PA_GROUP_DISPLAYNAME}`.toLowerCase()
                ) {
                    result.isPA = true;
                }
            }
        }

        result.isAuthorized = result.isPCA || result.isPA;
        return result;
    } catch (error) {
        console.error("Failed to check user authorization:", error);
        return result;
    }
}

/** Standalone PCA check (used by org settings page) */
export async function isCurrentUserPCA(): Promise<boolean> {
    const auth = await checkUserAuthorization();
    return auth.isPCA;
}
