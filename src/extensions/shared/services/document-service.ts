import * as SDK from "azure-devops-extension-sdk";
import { getClient } from "azure-devops-extension-api";
import { ExtensionManagementRestClient } from "azure-devops-extension-api/ExtensionManagement";

interface IExtensionDocumentMetadata {
    publisher: string;
    extension: string;
    scopeType: string;
    scopeValue: string;
}

class DocumentMetadataManager {
    public static getMetadata(): IExtensionDocumentMetadata {
        const extensionCtx = SDK.getExtensionContext();
        return {
            publisher: extensionCtx.publisherId,
            extension: extensionCtx.extensionId,
            scopeType: "Default",
            scopeValue: "Current",
        };
    }
}

class DocumentService {
    private extensionClient = getClient(ExtensionManagementRestClient);

    public async getDocumentById(
        collectionName: string,
        documentId: string,
        defaultDocument?: any
    ): Promise<any> {
        try {
            const m = DocumentMetadataManager.getMetadata();
            const doc = await this.extensionClient.getDocumentByName(
                m.publisher, m.extension, m.scopeType, m.scopeValue,
                collectionName, documentId
            );
            return doc;
        } catch {
            console.log(`No document found with ID ${documentId}`);
        }
        return defaultDocument;
    }

    public async listDocuments(
        collectionName: string,
        defaultDocuments?: any[]
    ): Promise<any[]> {
        try {
            const m = DocumentMetadataManager.getMetadata();
            const docs = await this.extensionClient.getDocumentsByName(
                m.publisher, m.extension, m.scopeType, m.scopeValue,
                collectionName
            );
            return docs;
        } catch {
            console.log(`No documents found in collection: ${collectionName}`);
        }
        return defaultDocuments || [];
    }

    public async deleteDocument(
        collectionName: string,
        documentId: string
    ): Promise<boolean> {
        try {
            const m = DocumentMetadataManager.getMetadata();
            await this.extensionClient.deleteDocumentByName(
                m.publisher, m.extension, m.scopeType, m.scopeValue,
                collectionName, documentId
            );
            return true;
        } catch (error) {
            console.log("Failed to delete document", error);
        }
        return false;
    }

    public async updateDocument(
        collectionName: string,
        documentId: string,
        document: any
    ): Promise<any> {
        let existing = await this.getDocumentById(collectionName, documentId, { id: documentId });
        try {
            delete document.__etag;
            Object.assign(existing, document);
            const m = DocumentMetadataManager.getMetadata();
            const updated = await this.extensionClient.setDocumentByName(
                existing,
                m.publisher, m.extension, m.scopeType, m.scopeValue,
                collectionName
            );
            return updated;
        } catch (error) {
            console.log("Failed to update document", error);
        }
        return document;
    }
}

export default DocumentService;
