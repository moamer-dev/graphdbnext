# GraphDBNext Workflows: Tools & Configuration Reference

This guide provides a detailed technical reference for all active workflow tools in the GraphDBNext Model Builder. Unlike Actions (which modify the graph), Tools are primarily used for logic branching, execution timing, and external data retrieval.

---

## Table of Contents
- [Control Flow](#control-flow)
- [External Services](#external-services)

---

## Control Flow

### **1. If / Else** (`tool:if`)
*   **Description**: Enables conditional branching within the workflow. The tool evaluates a set of logic groups; if they evaluate to true, the workflow follows the "Success" path; otherwise, it follows "Failure".
*   **Execution Logic**: 
    1. Checks the XML element in the current execution context.
    2. Sequentially evaluates "Condition Groups".
    3. Groups are combined with an outer operator (**AND** / **OR**).
    4. Each group contains one or more specific conditions (e.g., "Has Attribute") combined with an inner operator (**AND** / **OR**).
*   **Configuration UI**:
    *   **Condition Group**: Logical container for rules.
        *   **Outer Operator** (for multiple groups): `AND` (all groups must be true) or `OR` (at least one group must be true).
        *   **Inner Operator** (for multiple conditions within a group): `AND` (all conditions must match) or `OR` (any condition can match).
    *   **Condition Types**:
        *   **Has Children**: Checks if the element has child tags. Can filter by specific names.
        *   **Has No Children**: Checks if the element is a leaf node.
        *   **Has Ancestor**: Checks if a specific tag exists anywhere above the current element.
        *   **Has Parent**: Checks if the immediate parent matches a specific tag.
        *   **Has Attribute**: Checks for the presence of an attribute (e.g., `xml:id`).
        *   **Attribute Value Equals**: Checks if an attribute exactly matches a string.
        *   **ElementName Equals**: Checks if the current tag name matches a string.
        *   **Child Count**: Checks if the number of children falls within a Min/Max range.
        *   **Has Text Content**: Checks if the element contains non-empty text.

### **2. Switch** (`tool:switch`)
*   **Description**: Routes processing through different workflow paths based on a specific value.
*   **Execution Logic**:
    1. Extracts a value from the current XML element based on the "Switch On" source.
    2. Compares this value against a list of defined "Cases".
    3. Directs execution to the output branch associated with the first matching case.
*   **Configuration UI**:
    *   **Switch On**: Select the data source for the check.
        *   `Attribute Value`: Use a specific XML attribute (requires entering the **Attribute Name**).
        *   `Element Name`: Use the tag name of the current element.
        *   `Text Content`: Use the inner text of the element.
    *   **Cases**: List of branching rules.
        *   **Match Value**: The literal string to compare against the source.
        *   **Case Label**: The name of the output port on the canvas node (e.g., "Entity", "Property").

### **3. Delay** (`tool:delay`)
*   **Description**: Pauses the workflow execution for a specified amount of time.
*   **Execution Logic**: Utilizes a non-blocking `setTimeout` to halt the execution chain on the current worker.
*   **Configuration UI**:
    *   **Delay (milliseconds)**: The wait duration. Default is `1000` (1 second). Use this for rate-limiting calls to external APIs.

---

## External Services

### **4. Fetch API** (`tool:fetch-api`)
*   **Description**: Retrieves structured metadata from external authority files and research databases.
*   **Execution Logic**:
    1. Extracts an identifier (ID) from the XML element.
    2. Constructs a request to the selected **API Provider**.
    3. Normalizes the JSON response and stores it in `ctx.apiData`.
*   **Configuration UI**:
    *   **API Provider**: Select from `Wikidata`, `GND`, `VIAF`, `ORCID`, `GeoNames`, `Library of Congress`, or `Custom`.
    *   **ID Source**: How to find the ID to look up.
        *   `XML Attribute`: Pick a specific attribute (e.g., `ref="#Q42"`).
        *   `Element Text Content`: Use the tag's inner text.
        *   `XPath Expression`: Use a specific path (e.g., `./ancestor::person/@id`).
    *   **API Key**: Required for providers like GeoNames or Europeana.
    *   **Store in Context Key**: Custom name for the data in the context (default is the provider name). Accessible in later actions via `{{ $json["provider_name"] }}`.
    *   **Request Timeout**: Maximum wait time in milliseconds.

### **5. HTTP Request** (`tool:http`)
*   **Description**: Makes a generic HTTP/HTTPS request to any external endpoint.
*   **Execution Logic**: Performs a standard Fetch request. Response headers, status code, and JSON payload are persisted to the execution context.
*   **Configuration UI**:
    *   **Method**: `GET`, `POST`, `PUT`, etc.
    *   **URL**: The fully qualified endpoint address.
    *   **Authentication**: Supports `None`, `Bearer Token`, `Basic Auth`, `API Key (Header)`, or `Custom Header`.
    *   **Headers & Query Params**: Key-value editor for request customization.
    *   **Body Type**: `json`, `text`, `form-data`, or `x-www-form-urlencoded`.
    *   **Payload**: The data sent with `POST`/`PUT` requests (supports template tags).

### **6. Webhook** (`tool:webhook`)
*   **Description**: Sends an outbound notification to an external system (e.g., Slack, Discord, or a custom microservice).
*   **Execution Logic**: A "fire and forget" or synchronous POST request depending on system settings.
*   **Configuration UI**:
    *   **Webhook URL**: The destination listener.
    *   **Method**: `POST` or `PUT`.
    *   **Payload**: JSON object representing the event data. Often includes metadata from the current processing state.
