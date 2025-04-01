[繁體中文](./README.md)

# OpenAI Agents Visual Designer

This is a visual design tool based on the OpenAI Agents framework, allowing you to design and configure AI agents through simple drag-and-drop operations.

## Features

- 🎨 Intuitive drag-and-drop interface
- 🔄 Supports the OpenAI Agents framework
- 📊 Visual workflow design
- 🎯 Real-time preview
- 🛠️ Rich component library

## Tech Stack

- Next.js 15
- React 19
- React Flow
- Tailwind CSS
- TypeScript
- Zustand (State Management)

## Installation

1.  Clone the project:
    ```bash
    git clone https://github.com/xu5546223/openai-agent-UI.git
    cd openai-agent-UI
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

## Usage Instructions

1.  Open your browser and navigate to `http://localhost:3000`
2.  Drag required components from the left-side library onto the canvas
3.  Configure component parameters
4.  Connect components to build the workflow
5.  Preview and test your design

## How to Create an Agent (Basic Tutorial)

This tutorial will guide you through creating a basic Agent workflow using the visual designer.

**1. Add Nodes**

   - Drag the nodes you need from the "Node Library" on the left side of the interface onto the central canvas. For example, you can drag an `Agent` node and a `Handoff` node.
   - An `Agent` node represents an independent AI agent responsible for specific tasks.
   - A `Handoff` node is used to transfer control between different Agents.

**2. Configure Node Parameters**

   - Click on a node on the canvas. The parameter configuration panel for that node will appear on the right side.
   - **For an `Agent` node:**
     - `Name`: Give your Agent a unique name.
     - `Instructions`: Enter the instructions or system prompt for the Agent, telling it how to behave.
     - `Model`: Select the LLM model to use (e.g., `gpt-4o`).
     - (Other parameters like `Tools`, `MCP Servers`, etc., might not be fully supported for visual configuration in the current version but can be added in the generated code).
   - **For a `Handoff` node:**
     - Typically, you need to specify the target `Agent` to hand off to. In the current visual interface, this is usually achieved through connections (see next step). You might need to set conditions or a name for triggering the Handoff, depending on the specific node implementation.

**3. Connect Nodes**

   - Nodes usually have input handles (left or top) and output handles (right or bottom).
   - Drag a connection line from the output handle of one node to the input handle of another node to establish their workflow relationship.
   - For example, you can connect the output of a main `Agent` to a `Handoff` node, and then connect the `Handoff` node to another `Agent` specialized in a specific task.
   - The connection line represents the flow of control or, in the case of Handoffs, the potential target for delegation.

**4. Preview and Generate Code (Concept)**

   - (The core purpose of the current visual tool is to aid in designing the flow; actual execution might still rely on the generated Python code).
   - After completing the design, there is usually a feature (possibly not fully implemented yet) to convert your visual design into OpenAI Agents SDK Python code.
   - You can further add Tools, configure MCP Servers, or make finer adjustments based on the generated code.

**Important Reminders:**

   - This is a very basic tutorial covering only the core features currently implemented in the visual tool.
   - As the project evolves, node types, parameters, and connection methods may change.
   

## Important Notes

⚠️ **Disclaimer**: This is an experimental product of Vibe Code and may have the following issues:

- Some features might be unstable
- Unknown bugs may exist
- The interface might need optimization
- Documentation may be incomplete
- **The UI still has many unresolved issues.**
- **Layout Issues:** If you encounter incomplete or broken layouts, please try adjusting your browser zoom level to **80%**. This is a temporary workaround, and we plan to optimize this in future versions. Please understand that this is still an experimental project.

**Currently implemented core features:**

- Agent Creation
- MCP (Multi-Controller Process) Server Interaction
- Handoff Flow
- Configure custom LLM API Key in the settings page

**Many features are not yet fully implemented, such as:**

- Tool usage and configuration
- Support for more complex workflow designs
- Workflow import/export functionality

### How to Configure API Key

To allow the Agent to interact with Large Language Models (LLMs), you need to configure your API Key:

1.  Click the "Settings" button in the **top-left corner** of the interface.
2.  In the settings pop-up, find the API Key input field.
3.  Enter your OpenAI API Key.
    > **Note**: Currently, only standard OpenAI API Key format  or keys compatible with the OpenAI API format might be supported. Keys from other services may not work correctly.
4.  Click "Save" or simply close the pop-up.

> Note: Your API Key will be stored in your browser's local storage and will not be uploaded to any server.

We welcome community participation and contributions:

- If you find any issues, please submit an Issue
- If you have suggestions for improvement, feel free to submit a Pull Request
- We warmly welcome anyone willing to participate in the development

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- OpenAI Agents Framework
- React Flow Team
- All Contributors 

## Contribution Guidelines

- If you find any issues, please submit an Issue
- If you have suggestions for improvement, feel free to submit a Pull Request
- We warmly welcome anyone willing to participate in the development 