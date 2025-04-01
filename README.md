# Event Processing System

## Problem Statement

We are building a system to connect two applications (source and target) with different event processing requirements:

### Source Application
- Sends events with structure:
  ```json
  {
    "id": "<randomId>",
    "name": "test event",
    "body": "test body",
    "timestamp": "<currentTimestamp>"
  }
  ```
- Sends each event only once
- Requires 2xx response within 500ms
- No retries on failure

### Target Application
- GraphQL API
- Requires enhanced event structure with additional field:
  ```json
  {
    "brand": "testBrand"
  }
  ```
- Rate-limited
- Events from source may flow more frequently than target can process

## Architecture

```mermaid
graph TD

    %% Source Application to API Gateway %%
    A[Source Application] -->|Sends Event| B(AWS API Gateway)
    B -->|Validates & Authenticates| C[AWS Lambda (Event Processor)]

    %% Store Payload in DynamoDB %%
    C -->|Store Payload| D[(Amazon DynamoDB)]
    C -->|Push Event to Queue| E{Amazon SQS}

    %% Rate Limited Processing %%
    E -->|Rate-Limited Fetch| F[AWS Lambda (Dispatcher)]
    F -->|Enrich Event (Add brand: 'testBrand')| G[Target Application (GraphQL)]
    G -->|Response Success| H[Mark Event as Processed in DB]

    %% Handling Failures %%
    F --x|Failure (Rate Limit, Error, Timeout)| I[Retry with Exponential Backoff]
    I --x|Max Retries Reached| J{Amazon SQS Dead Letter Queue (DLQ)}

    %% Monitoring & Observability %%
    C -->|Log & Monitor Events| M[Amazon CloudWatch]
    F -->|Trace Requests| N[AWS X-Ray]
```

## Technical Requirements

- Cloud-based solution (AWS)
- CI/CD pipeline
- Secure authentication
- High availability
- Full event visibility and tracing
- Comprehensive test coverage
- Complete documentation (HLD/LLD)
- Maintainable and supportable
- Proper error handling and visibility

## Technology Stack

- Programming Language: TypeScript
- Infrastructure as Code: Terraform
- Configuration Management: Ansible
- Cloud Provider: AWS
- Event Storage: DynamoDB
- Message Queue: SQS
- API Gateway for ingress
- Lambda for serverless compute
- S3 for long-term storage
- CloudWatch for monitoring
- X-Ray for tracing