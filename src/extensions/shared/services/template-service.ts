import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, IProjectPageService } from "azure-devops-extension-api";
import { GitRestClient } from "azure-devops-extension-api/Git";
import DocumentService from "./document-service";
import {
    IGovernedTemplate, ITemplateVersion, IGitTag,
    User, generateId
} from "../schemas";

const COLLECTION_NAME = "governed-templates";

function getCurrentUser(): User {
    const u = SDK.getUser();
    return {
        id: u.id,
        descriptor: u.descriptor,
        displayName: u.displayName,
        imageUrl: u.imageUrl,
        name: u.name,
    };
}

class TemplateService {
    private documentService = new DocumentService();

    public async getTemplates(): Promise<IGovernedTemplate[]> {
        const docs = await this.documentService.listDocuments(COLLECTION_NAME, []);
        return docs as IGovernedTemplate[];
    }

    public async getTemplate(id: string): Promise<IGovernedTemplate | null> {
        const doc = await this.documentService.getDocumentById(COLLECTION_NAME, id, null);
        return doc as IGovernedTemplate | null;
    }

    public async createTemplate(
        name: string,
        description: string,
        category: string,
        repositoryId: string,
        repoName: string,
        projectId: string,
        projectName: string
    ): Promise<IGovernedTemplate> {
        const now = new Date().toISOString();
        const user = getCurrentUser();
        const template: IGovernedTemplate = {
            id: generateId(),
            name,
            description,
            category,
            repositoryId,
            repoName,
            projectId,
            projectName,
            createdBy: user,
            createdOn: now,
            lastModifiedBy: user,
            lastModifiedOn: now,
            versions: [],
        };
        await this.documentService.updateDocument(COLLECTION_NAME, template.id, template);
        return template;
    }

    public async deleteTemplate(id: string): Promise<boolean> {
        return this.documentService.deleteDocument(COLLECTION_NAME, id);
    }

    public async addVersion(
        templateId: string,
        tagName: string,
        objectId: string,
        peeledObjectId: string,
        templateFilePath: string,
        helpUrl: string
    ): Promise<IGovernedTemplate | null> {
        const template = await this.getTemplate(templateId);
        if (!template) return null;

        const user = getCurrentUser();
        const now = new Date().toISOString();
        const version: ITemplateVersion = {
            versionId: generateId(),
            tagName,
            objectId,
            peeledObjectId,
            templateFilePath: templateFilePath || "",
            helpUrl: helpUrl || "",
            status: "Ready",
            publishedBy: user,
            publishedOn: now,
        };

        template.versions = template.versions || [];
        template.versions.push(version);
        template.lastModifiedBy = user;
        template.lastModifiedOn = now;

        await this.documentService.updateDocument(COLLECTION_NAME, templateId, template);
        return template;
    }

    public async deleteVersion(
        templateId: string,
        versionId: string
    ): Promise<IGovernedTemplate | null> {
        const template = await this.getTemplate(templateId);
        if (!template) return null;

        template.versions = (template.versions || []).filter(v => v.versionId !== versionId);
        template.lastModifiedBy = getCurrentUser();
        template.lastModifiedOn = new Date().toISOString();

        await this.documentService.updateDocument(COLLECTION_NAME, templateId, template);
        return template;
    }

    public async updateVersionStatus(
        templateId: string,
        versionId: string,
        status: string
    ): Promise<IGovernedTemplate | null> {
        const template = await this.getTemplate(templateId);
        if (!template) return null;

        const version = (template.versions || []).find(v => v.versionId === versionId);
        if (!version) return template;

        version.status = status;
        template.lastModifiedBy = getCurrentUser();
        template.lastModifiedOn = new Date().toISOString();

        await this.documentService.updateDocument(COLLECTION_NAME, templateId, template);
        return template;
    }

    public async getRepositories(projectId: string): Promise<Array<{ id: string; name: string }>> {
        try {
            const gitClient = getClient(GitRestClient);
            const repos = await gitClient.getRepositories(projectId);
            return (repos || []).map(r => ({ id: r.id, name: r.name }));
        } catch (error) {
            console.error("Failed to load repositories:", error);
            return [];
        }
    }

    public async getRepositoryTags(repositoryId: string, projectId: string): Promise<IGitTag[]> {
        try {
            const gitClient = getClient(GitRestClient);
            const refs = await gitClient.getRefs(repositoryId, projectId, "tags/", false, false, false, false, true);
            return (refs || []).map(ref => ({
                name: ref.name || "",
                objectId: ref.objectId || "",
                peeledObjectId: ref.peeledObjectId || "",
                url: ref.url || "",
            }));
        } catch (error) {
            console.error("Failed to load repository tags:", error);
            return [];
        }
    }

    public async getCurrentProjectInfo(): Promise<{ id: string; name: string } | null> {
        try {
            const projectService = await SDK.getService<IProjectPageService>(
                CommonServiceIds.ProjectPageService
            );
            const project = await projectService.getProject();
            if (project) {
                return { id: project.id, name: project.name };
            }
        } catch (error) {
            console.error("Failed to get project info:", error);
        }
        return null;
    }
}

export default TemplateService;
