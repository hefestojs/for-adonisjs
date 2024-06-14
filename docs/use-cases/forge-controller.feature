Feature: Forge Controller
  As a developer
  I want to generate a new HTTP controller class from a live database
  So that I can automate controller creation

  Scenario: Successfully generate a controller
    Given a valid database schema "schema.table_name"
    And the command "forge:controller schema.table_name" is executed
    Then a new controller file "table_name_controller.ts" should be created in the directory "app/controllers"
    And the file should contain "class TableNameController"

  Scenario: Controller file already exists and overwrite is false
    Given a valid database schema "schema.table_name"
    And a controller file "table_name_controller.ts" already exists
    When the command "forge:controller schema.table_name" is executed
    Then the controller file "table_name_controller.ts" should not be overwritten

  Scenario: Controller file already exists and overwrite is true
    Given a valid database schema "schema.table_name"
    And a controller file "table_name_controller.ts" already exists
    When the command "forge:controller schema.table_name --overwrite" is executed
    Then the controller file "table_name_controller.ts" should be overwritten

  Scenario: Invalid database schema or table name
    Given an invalid database schema "invalid_schema.invalid_table"
    When the command "forge:controller invalid_schema.invalid_table" is executed
    Then an error message "Controller not generated" should be displayed

  Scenario: Basic OpenAPI specifications flag
    Given a valid database schema "schema.table_name"
    When the command "forge:controller schema.table_name --openapi" is executed
    Then the generated controller file "table_name_controller.ts" should include "OpenAPI"
