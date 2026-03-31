export interface User {
    id: string;
    descriptor: string;
    displayName: string;
    imageUrl: string;
    name: string;
}

export interface IGovernedTemplate {
    id: string;
    name: string;
    description: string;
    createdBy: User;
    createdOn: string;
    lastModifiedBy: User;
    lastModifiedOn: string;
    category: string;
    projectId: string;
    projectName: string;
    repoName: string;
    repositoryId: string;
    versions: ITemplateVersion[];
}

export interface ITemplateVersion {
    versionId: string;
    tagName: string;
    objectId: string;
    peeledObjectId: string;
    templateFilePath: string;
    helpUrl: string;
    status: string;
    publishedBy: User;
    publishedOn: string;
}

export interface IGitTag {
    name: string;
    objectId: string;
    peeledObjectId: string;
    url: string;
}

export const TEMPLATE_CATEGORIES = [
    "Azure Container Apps",
    "Azure Functions",
    "Azure Kubernetes Service",
    "OpenShift",
    "AWS Lambda",
    "Azure Web Apps",
    "Other"
];

export function generateId(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
