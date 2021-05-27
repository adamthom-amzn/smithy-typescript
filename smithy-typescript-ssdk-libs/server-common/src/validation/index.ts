/*
 *  Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License").
 *  You may not use this file except in compliance with the License.
 *  A copy of the License is located at
 *
 *   http://aws.amazon.com/apache2.0
 *
 *  or in the "license" file accompanying this file. This file is distributed
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *  express or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 */

import { SmithyException } from "@aws-sdk/smithy-client";

export * from "./validators";

interface StandardValidationFailure<ConstraintBoundsType, FailureType> {
  memberName: string;
  constraintType: string;
  constraintValues: ArrayLike<ConstraintBoundsType>;
  failureValue: FailureType;
}

export interface EnumValidationFailure extends StandardValidationFailure<string, string> {
  constraintType: "enum";
  constraintValues: string[];
}

export interface LengthValidationFailure extends StandardValidationFailure<number | undefined, number> {
  constraintType: "length";
  constraintValues: [number, number] | [undefined, number] | [number, undefined];
}

export interface PatternValidationFailure {
  memberName: string;
  constraintType: "pattern";
  constraintValues: string;
  failureValue: string;
}

export interface RangeValidationFailure extends StandardValidationFailure<number | undefined, number> {
  constraintType: "range";
  constraintValues: [number, number] | [undefined, number] | [number, undefined];
}

export class RequiredValidationFailure {
  memberName: string;
  constraintType: "required" = "required";

  constructor(memberName: string) {
    this.memberName = memberName;
  }
}

export interface UniqueItemsValidationFailure {
  memberName: string;
  constraintType: "uniqueItems";
  failureValue: Array<any>;
}

export type ValidationFailure =
  | EnumValidationFailure
  | LengthValidationFailure
  | PatternValidationFailure
  | RangeValidationFailure
  | RequiredValidationFailure
  | UniqueItemsValidationFailure;

export interface ValidationContext<O extends string> {
  operation: O;
}

export type ValidationCustomizer<O extends string> = (
  context: ValidationContext<O>,
  failures: ValidationFailure[]
) => SmithyException | undefined;

export const generateValidationSummary = (failures: readonly ValidationFailure[]): string => {
  let failingMembers = new Set(failures.map((failure) => failure.memberName));

  var message = `${failures.length} validation error${failures.length > 1 ? "s" : ""} `;

  if (failures.length > 1) {
    message += `across ${failingMembers.size} ` + `member${failingMembers.size > 1 ? "s" : ""} `;
  }

  message += `detected. `;

  message += `Member '${failures[0].memberName}' failed: ${generateValidationMessage(failures[0])}.`;

  return message;
};

export const generateValidationMessage = (failure: ValidationFailure): string => {
  let failureValue = failure.constraintType === "required" ? "null" : failure.failureValue.toString();

  let prefix: string;
  let suffix: string;
  switch (failure.constraintType) {
    case "required": {
      prefix = "Value";
      suffix = "must not be null";
      break;
    }
    case "enum": {
      prefix = "Value";
      suffix = `must satisfy enum value set: ${failure.constraintValues}`;
      break;
    }
    case "length": {
      prefix = "Value with length";
      let min = failure.constraintValues[0];
      let max = failure.constraintValues[1];
      if (min === undefined) {
        suffix = `must have length less than or equal to ${max}`;
      } else if (max === undefined) {
        suffix = `must have length greater than or equal to ${min}`;
      } else {
        suffix = `must have length between ${min} and ${max}, inclusive`;
      }
      break;
    }
    case "pattern": {
      prefix = "Value";
      suffix = `must satisfy regular expression pattern: ${failure.constraintValues}`;
      break;
    }
    case "range": {
      prefix = "Value";
      let min = failure.constraintValues[0];
      let max = failure.constraintValues[1];
      if (min === undefined) {
        suffix = `must be less than or equal to ${max}`;
      } else if (max === undefined) {
        suffix = `must be greater than or equal to ${min}`;
      } else {
        suffix = `must be between ${min} and ${max}, inclusive`;
      }
      break;
    }
    case "uniqueItems": {
      prefix = "Value with repeated values";
      suffix = "must have unique values";
    }
  }
  return `${prefix} ${failureValue} failed to satisfy constraint: Member ${suffix}`;
};
