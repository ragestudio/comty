# Code Style Guide
## Introduction
This document outlines the code style guidelines for the Comty project. The goal of these guidelines is to create readable, consistent, and maintainable code across the entire codebase.

## General Principles
- Always prioritize code readability and maintainability over cleverness or brevity.

- Write code that is easy to understand by other developers and your future self.

- Follow established patterns and conventions in the codebase, even if it means deviating from personal preferences.

- Write code that is compatible with the latest stable version of the language being used.

- Refactor code as needed to maintain readability and avoid duplication.

## Language-specific Guidelines
### JavaScript
- Use ES6 syntax and features whenever possible.

- Use semicolons to terminate statements.

- Use double quotes for strings, but single quotes for JSX.

- Use const and let instead of var.

- Always use strict equality (=== and !==) for comparisons.

- Avoid using eval() and with().

- Use camelCase for variable and function names.

- Use PascalCase for class and component names.

- Use four spaces for indentation.

- Use a CSS preprocessor like LESS to organize styles. (We recommend use LESS cause it's used in the project, we prefer to no include another dependency)

- Use kebab-case for class and ID names.

- Use four spaces for indentation.

- Use a consistent naming convention for classes and IDs, and avoid using inline styles.

- Use the :hover, :focus, and :active pseudo-classes as needed.

- Use descriptive class and ID names that clearly indicate their purpose.

## Conclusion
By following these code style guidelines, we can create code that is easy to read, understand, and maintain. These guidelines are not exhaustive, and there may be cases where they don't apply or conflict with other guidelines. In such cases, use your best judgement and work with the team to come to a consensus.