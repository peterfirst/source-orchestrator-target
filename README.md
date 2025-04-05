

# Orchestrator System

  

## Overview

  

This document outlines the design and implementation of a robust event processing system designed to bridge the gap between a source application and a target GraphQL API. The system handles event ingestion, transformation, rate-limited delivery, and robust error handling, all while ensuring high availability, security, and observability.

  

## Problem Statement

  

The system addresses the challenge of connecting two applications with disparate event processing requirements:

  

### Source Application Characteristics

  

*  **Event Structure:** Sends events with the following JSON structure:

```json

{

"id": "<randomId>",

"name": "test event",

"body": "test body",

"timestamp": "<currentTimestamp>"

}

```

*  **Delivery Guarantees:** Sends each event exactly once.

*  **Performance Requirements:** Requires a 2xx HTTP response within 500ms.

*  **Error Handling:** Does not implement retries on failure.

  

### Target Application Characteristics

  

*  **API Type:** GraphQL API.

*  **Event Structure:** Requires an enriched event structure with an additional `brand` field:

```json

{

"id": "<randomId>",

"name": "test event",

"body": "test body",

"timestamp": "<currentTimestamp>",

"brand": "testBrand"

}

```

*  **Rate Limiting:** Imposes rate limits on event processing.

*  **Throughput Disparity:** The source application may generate events at a higher rate than the target application can consume.

  

## System Architecture

  

The architecture leverages AWS services to create a scalable, resilient, and observable event processing pipeline.

  

```mermaid

graph LR

%% Source Application to API Gateway %%
A[Source Application] -->|"Sends Event (HTTP POST)"| B("AWS API Gateway")
B -->|"Validates & Authenticates"| C["AWS Lambda (Authorizer)"]
 

%% Store Payload in DynamoDB %%
C -->|"Store Payload (Async)"| D("Amazon DynamoDB")

%% Dynamodb to eventbridge %%
D -->|"Push Event to EventBridge (Async)"| E["Event Bridge (pipe)"]

%% eventbridge to sqs %%
E-->|"Push Event to Queue (Async)"| F("Amazon SQS (Standard Queue)")

%% sqs to dispatcher %%
F -->|"Fetch Event (Rate-Limited)"| G("AWS Lambda (Dispatcher)")
  
%% Rate Limited Processing %%
G -->|"(1) Enrich Event (Add brand: 'testBrand')"| H("Target Application (GraphQL API)")
G -->|"(2) Response Success"| I("Mark Event as Processed in DB")

%% Handling Failures %%
G -->|"(3) Failure (Rate Limit, Error, Timeout)"| J("Retry with Exponential Backoff")
G -->|"(4) Max Retries Reached"| K("Amazon SQS Dead Letter Queue (DLQ)") 

%% Monitoring & Observability %%
B -->|"Log & Monitor Events"| M("Amazon CloudWatch")
C -->|"Log & Monitor Events"| M("Amazon CloudWatch")
D -->|"Log & Monitor Events"| M("Amazon CloudWatch")
E -->|"Log & Monitor Events"| M("Amazon CloudWatch")


%% feature improvements %%
M -->|"Trace Requests"| N("AWS X-Ray (TODO)")

%% Long Term Storage %%
D -->|"Store Event"| O("Amazon S3")
K -->|"Store Event"| O("Amazon S3")

```


## How it works!!!

### AWS API Server endpoints
```sh
# health endpoint
https://w4rjbcujw2.execute-api.us-east-1.amazonaws.com/prod/events/health
```
**REQUEST:**
```sh
curl https://w4rjbcujw2.execute-api.us-east-1.amazonaws.com/prod/health -H'Content-Type: application/json' -H'x-api-key: secret'
```
**RESPONSE:**
```sh
{"message":"OK"}%   
```
---
```sh
# Use this to send data to the orchestrator
https://w4rjbcujw2.execute-api.us-east-1.amazonaws.com/prod/events
```
```sh
curl -X POST https://w4rjbcujw2.execute-api.us-east-1.amazonaws.com/prod/events -H 'Content-Type: application/json' -H 'x-api-key: secret' -d '{ "id": "<random-id>", "name": "Recycled Granite Shoes", "body": "The Eldon Chicken is the latest in a series of other products from Bruen - Kautzer", "timestamp": 1743839352 }'
```

**RESPONSE:**
```json
{"message":"Item inserted successfully","item":{"id":{"S":"300b3243-6838-433b-b135-7bffe6874fc2"},"status":{"S":"PENDING"},"timestamp":{"N":"1743891775"},"payload":{"M":{"id":{"S":"0e58c0d3-8381-4ad4-a382-36ede906eec9"},"name":{"S":"Recycled Granite Shoes - p1"},"body":{"S":"The Eldon Chicken is the latest in a series of other products from Bruen - Kautzer"},"timestamp":{"N":"1743839352"}}}}}
```
---

### Target Server endpoints
```sh
# health endpoint
http://ec2-13-218-254-77.compute-1.amazonaws.com:8080
```
**REQUEST:**
```sh
curl https://w4rjbcujw2.execute-api.us-east-1.amazonaws.com
```
**RESPONSE:**
```sh
OK%   
```

```sh
# This is the endpoint that the source application will send data
https://w4rjbcujw2.execute-api.us-east-1.amazonaws.com/prod/events
```

**REQUEST:**

```sh
curl -X POST https://w4rjbcujw2.execute-api.us-east-1.amazonaws.com/prod/events -H 'Content-Type: application/json' -H 'x-api-key: secret' -d '{ "id": "<random-id>", "name": "Recycled Granite Shoes", "body": "The Eldon Chicken is the latest in a series of other products from Bruen - Kautzer", "timestamp": 1743839352 }'
```

**RESPONSE:**
```json
{"message":"Item inserted successfully","item":{"id":{"S":"300b3243-6838-433b-b135-7bffe6874fc2"},"status":{"S":"PENDING"},"timestamp":{"N":"1743891775"},"payload":{"M":{"id":{"S":"0e58c0d3-8381-4ad4-a382-36ede906eec9"},"name":{"S":"Recycled Granite Shoes - p1"},"body":{"S":"The Eldon Chicken is the latest in a series of other products from Bruen - Kautzer"},"timestamp":{"N":"1743839352"}}}}}
```   

# Use this to send data to the orchestator
http://ec2-13-218-254-77.compute-1.amazonaws.com:8080/send-fake-data

request:
curl http://ec2-13-218-254-77.compute-1.amazonaws.com:8080/send-fake-data -H’X-TARGET-API-URL: https://w4rjbcujw2.execute-api.us-east-1.amazonaws.com/prod/events

response:
https://github.com/peterfirst/source-orchestrator-target/actions/runs/14285282418/job/40039620301
```
##### GraphQL Queries
```sh
http://ec2-13-218-254-77.compute-1.amazonaws.com:8080/graphql

# Fetch a single item
query {
  getItem(id: "12345") {
    id
    name
    body
    timestamp
    brand
  }
}

# Fetch all the items
query {
  getItems {
    id
    name
    body
    timestamp
    brand
  }  
}

# clears the entire database
query {
  clearItems
}

# Create new entries in the sqlite database.
# It is used by the orchestrator 
mutation {
  createItem(
    id: "12345"
    name: "Test Event"
    body: "This is a test body"
    timestamp: 1680451200
    brand: "Test Brand"
  ) {
    id
    name
    body
    timestamp
    brand
  }
}
```

##### Unit test
![alt text](docs/unit-test.png)

### Considerations - COMPLETED!!!

- System needs to be working in the cloud
- Deployment must be through CI/CD pipeline
- System needs to be secure (authentication)
- System needs to be highly available
- We need to have full visibility on events flowing between `source` and `target` systems
- We need to be able to trace the flow of every single event
- Everything must be covered with tests
- Everything needs to be properly documented, with HLD and LLD included
- System needs to be easy to maintain and support
- All errors/issues need to be visible and handled properly
- We want to see the source code and the working application
- We want to see not only the solution but also how you think and your working process, so please keep all your commits accessible, don't squash them, and use proper naming standards for them

### Required Technology

- Use Node (TypeScript) or GO as a programming language
- Use Terraform to provision the infrastructure
- Use AWS or GCP
