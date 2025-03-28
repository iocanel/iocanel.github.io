+++
title = "Creating an MCP Server with Quarkus and Backstage"
author = ["Ioannis Canellos"]
date = 2025-03-22
draft = false
+++

## Intro {#intro}

It seems that everyone is an MCP guru these days.

I am not.

In fact, I know almost nothing about it. I am just aware of the concept.

This post describes the steps I took in order to create an MCP from scratch, resulting in the project created at:

-   <https://github.com/iocanel/backstage-mcp>

I also recorded my journey starting from scatch with almost zero knowledge on the topic and using the Quarkus Blog as a guide:

### Full version
This is me having no idea what I am doing and spending 1.5 hours trying to figure it out.
- {{< youtube  dEtPUwI9B3A>}}
### Shorter version
A reshoot of the first video, so that I can come up with something shorter.
- {{< youtube  BusK-9Z9Le8>}}

## What is MCP? {#what-is-mcp}

MCP stands for **Model Context Protocol**. It’s the protocol that tools like [Goose](https://github.com/block/goose), an interactive AI shell, use to talk to plugins.

The idea is simple:

-   The AI shell sends JSON messages over stdin.
-   The plugin processes them and sends responses over stdout.

If you’ve ever written a language server or CLI plugin using stdio, this will feel familiar.

In this case, the plugin acts as a bridge between Goose and Backstage, using [Quarkus Backstage](https://docs.quarkiverse.io/quarkus-backstage/dev/index.html)


## The goal {#the-goal}

I wanted to:

-   List available Backstage templates from Goose.
-   Instantiate a template using parameters from a YAML file.

And I wanted to do this using:

-   [Quarkus](https://quarkus.io) as the backend,
-   [Backstage](https://github.com/Backstage/backstage) as the API target,
-   [MCP](https://github.com/Backstage/mcp) as the communication protocol,
-   [Quarkus Backstage](https://github.com/quarkiverse/quarkus-backstage) and [Quarkus MCP Server](https://github.com/quarkiverse/quarkus-mcp-server) extensions to simplify things.


## Anatomy of the project {#anatomy-of-the-project}


### Dependencies {#dependencies}

The project uses two main Quarkus extensions:

```xml
<dependency>
  <groupId>io.quarkiverse.mcp</groupId>
  <artifactId>quarkus-mcp-server-stdio</artifactId>
  <version>1.0.0.Alpha5</version>
</dependency>

<dependency>
  <groupId>io.quarkiverse.backstage</groupId>
  <artifactId>quarkus-backstage</artifactId>
  <version>0.4.1</version>
</dependency>
```

The first implements an MCP server using stdin/stdout. The second talks to the Backstage API.


### Implementation {#implementation}

The actual implementation lives in a single Java class.
It defines the logic for handling incoming MCP requests. Right now, it supports:

-   Listing templates
-   Instantiating a template using values from a YAML file

The actual code:

```java
package org.acme;

import java.util.List;


import io.quarkiverse.backstage.client.BackstageClient;
import io.quarkiverse.backstage.common.utils.Serialization;
import io.quarkiverse.mcp.server.Tool;
import io.quarkiverse.mcp.server.ToolArg;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Map;
import java.nio.file.Path;
import com.fasterxml.jackson.core.type.TypeReference;

@ApplicationScoped
public class Backstage {

  @Inject
  BackstageClient client;

  @Tool(description = "List backstage templates")
  public List<String> listTemplates() {
    return client.entities().list("kind=template").stream().map(e -> e.getMetadata().getName()).toList();
  }

  @Tool(description = "Create a backstage project using a template")
  public String createProject(@ToolArg(description = "Template name") String templateName,
                              @ToolArg(description = "Path to parameters file") String valuesFile) {
    Map<String, Object> values = Serialization.unmarshal(Path.of(valuesFile).toFile(), new TypeReference<Map<String, Object>>() {});
    return client.templates().withName(templateName).instantiate(values);
  }
}
```

That’s it. Minimal and focused.


## Backstage setup {#backstage-setup}

To allow the MCP plugin to talk to your Backstage instance, make sure `app-config.yaml` has a service-to-service token configured like this:

```yaml
backend:
  auth:
    externalAccess:
      - type: static
        options:
          token: <put your token here>
          subject: curl-requests
```

That token will be used by the plugin to authenticate against the Backstage API.


## Goose integration {#goose-integration}

Goose can be configured to use this MCP plugin via `config.yaml`:

```yaml
quarkus-backstage-mcp:
  name: quarkus-backstage-mcp
  enabled: true
  type: stdio
  cmd: java
  args:
    - -jar
    - /path/to/demo/backstage-mcp/target/quarkus-app/quarkus-run.jar
  envs:
    QUARKUS_BACKSTAGE_URL: <url to backstage instance>
    QUARKUS_BACKSTAGE_TOKEN: <bakcstage service to service token>
```

Alternatively, you could launch the jar directly using Java or through your favorite launch tool.


## Example prompts {#example-prompts}

Once everything is wired up, you can interact with Backstage through Goose:


### List available templates {#list-available-templates}

```bash
list all the available backstage templates
```


### Instantiate a template {#instantiate-a-template}

First, extract the default values:

```sh
quarkus backstage template info --show-default-values <template-name> > values.yaml
```

Then prompt Goose:

```bash
create a new project from template <template-name> using values from values.yaml
```

The plugin takes care of everything: parsing, calling the API, and responding over stdout.


## Reflections {#reflections}

It was much easier than I inital thought. Today, I managed two record two videos on the subject,
create a github project and write a blog about it.

I find the result pretty impressive and I love the fact that I can allow tools like goose instantly gain
access to the tools I've been building.

Next steps?

I think I want re-visit every single [Quarkus](https://quarkus.io/) extension I've created and add an \`mcp\` command to it.
Well, it's still Saturday evening, so who knows ...

Until then, the code is there. And it works.
