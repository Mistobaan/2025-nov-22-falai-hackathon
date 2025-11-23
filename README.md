

# Deployment 

The project uses Digital Ocean for deployment.

## Setup

1. Create a Digital Ocean account and a project.
2. Create a Digital Ocean droplet.
3. Install the required dependencies.
4. Deploy the project.

## Features

### Defect Editor
- **Pre-load Phase**: Automatically checks for blueprint API status and Claude API completion.
- **Auto-Generation**: If no defects exist, automatically triggers "generating defects" with visual feedback.
- **Defect Selection**: Pre-populates the UI with generated defects selected by default. Users can deselect items before saving.
- **Error Handling**: Fails gracefully with a toast message if the blueprint process fails.
