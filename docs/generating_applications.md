# Generating Applications

The durable input is the checked Surface `.kdl` file. Generated source code is one
implementation of that specification, not part of the Surface language.

## Inputs

Give the implementer:

1. the complete `.kdl` source;
2. [`skills/surface/SKILL.md`](../skills/surface/SKILL.md);
3. any assets explicitly named by the specification;
4. an empty `build/` output directory;
5. the acceptance command or observable result you expect.

Do not provide an existing implementation when you want an independent generation.

## Suggested Prompt

```text
Use $surf-build.
```

Claude Code users can run `/surf:build` instead. Run `surf init` in the project and
select one or both agents to install their project-local entry points with the same
workflow.

The implementation may use any architecture compatible with the declared stack. Surface
aims for consistent products and behavior, not identical source code.

## Design Systems

For a consistent visual family, pin a design system in the application stack:

```kdl
stack "web" {
    target "browser"
    technology "markup" "html"
    technology "language" "typescript"
    technology "designSystem" "govUkFrontend" version="6.4.0" {
        context "Use official components and supplied assets without application custom CSS."
    }
}
```

Name exact components or root classes in context when that choice matters. A pinned
design system narrows the visual choices, while ambiguous component wording can still
produce visible differences.

## Independent Generations

To measure reproducibility:

1. freeze the Surface file, skill, assets, and generation prompt;
2. start each generation in a fresh session and empty directory;
3. prevent generators from reading one another's output;
4. record model, tool versions, repairs, assumptions, and source hashes;
5. run the same behavioral and visual tests against every output.
