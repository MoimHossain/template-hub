# Template Hub

**Template Hub** is an Azure DevOps extension for managing and governing pipeline templates across your organization.

## Features

### 🏪 Template Marketplace
Browse and discover governed pipeline templates from the **Pipelines** hub. Search by name or filter by archetype. Click any template card to view details, pick a version, and get the YAML usage snippet.

### ⚙️ Template Management (Project Settings)
Project and collection administrators can register pipeline templates, manage versions (from Git tags), and control version status (Ready / Blocked).

### 📊 Automatic Usage Tracking
A built-in pipeline decorator automatically tracks which pipelines use which templates and versions. View usage analytics directly from the version context menu.

### 🏢 Organization Settings
Organization-level configuration for Template Hub (Project Collection Administrators only).

## Getting Started

1. Install the extension from the Visual Studio Marketplace.
2. Navigate to **Project Settings → One Template (ING)** to register your first template.
3. Select a repository, create versions from Git tags, and manage their status.
4. Users can browse available templates from **Pipelines → Template Marketplace (ING)**.

## Permissions

- **Template Management** requires **Project Administrator** or **Project Collection Administrator** role.
- **Template Marketplace** is accessible to all project members.

## How Usage Tracking Works

Template Hub includes a pipeline decorator that runs automatically on every pipeline job. It detects repository resources declared in your pipeline YAML and matches them against registered templates. Usage data is stored in Azure DevOps extension data storage — no external backend required.

## Feedback & Support

For issues, questions, or feature requests, please visit the [GitHub repository](https://github.com/moimhossain/template-hub).
