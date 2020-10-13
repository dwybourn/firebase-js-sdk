/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { fail } from './assert';
import { Code, FirestoreError } from './error';
import { Dict, forEach } from './obj';
import { DocumentKey } from '../model/document_key';
import { ResourcePath } from '../model/path';

/** Types accepted by validateType() and related methods for validation. */
export type ValidationType =
  | 'undefined'
  | 'object'
  | 'function'
  | 'boolean'
  | 'number'
  | 'string'
  | 'non-empty string';

export function validateNonEmptyString(
  functionName: string,
  argumentName: string,
  argument?: string
): asserts argument is string {
  if (!argument) {
    throw new FirestoreError(
      Code.INVALID_ARGUMENT,
      `Function ${functionName}() cannot be called with an empty ${argumentName}.`
    );
  }
}

/**
 * Validates that two boolean options are not set at the same time.
 */
export function validateIsNotUsedTogether(
  optionName1: string,
  argument1: boolean | undefined,
  optionName2: string,
  argument2: boolean | undefined
): void {
  if (argument1 === true && argument2 === true) {
    throw new FirestoreError(
      Code.INVALID_ARGUMENT,
      `${optionName1} and ${optionName2} cannot be used together.`
    );
  }
}

/**
 * Validates that `path` refers to a document (indicated by the fact it contains
 * an even numbers of segments).
 */
export function validateDocumentPath(path: ResourcePath): void {
  if (!DocumentKey.isDocumentKey(path)) {
    throw new FirestoreError(
      Code.INVALID_ARGUMENT,
      `Invalid document reference. Document references must have an even number of segments, but ${path} has ${path.length}.`
    );
  }
}

/**
 * Validates that `path` refers to a collection (indicated by the fact it
 * contains an odd numbers of segments).
 */
export function validateCollectionPath(path: ResourcePath): void {
  if (DocumentKey.isDocumentKey(path)) {
    throw new FirestoreError(
      Code.INVALID_ARGUMENT,
      `Invalid collection reference. Collection references must have an odd number of segments, but ${path} has ${path.length}.`
    );
  }
}

/**
 * Returns true if it's a non-null object without a custom prototype
 * (i.e. excludes Array, Date, etc.).
 */
export function isPlainObject(input: unknown): boolean {
  return (
    typeof input === 'object' &&
    input !== null &&
    (Object.getPrototypeOf(input) === Object.prototype ||
      Object.getPrototypeOf(input) === null)
  );
}

/** Returns a string describing the type / value of the provided input. */
export function valueDescription(input: unknown): string {
  if (input === undefined) {
    return 'undefined';
  } else if (input === null) {
    return 'null';
  } else if (typeof input === 'string') {
    if (input.length > 20) {
      input = `${input.substring(0, 20)}...`;
    }
    return JSON.stringify(input);
  } else if (typeof input === 'number' || typeof input === 'boolean') {
    return '' + input;
  } else if (typeof input === 'object') {
    if (input instanceof Array) {
      return 'an array';
    } else {
      const customObjectName = tryGetCustomObjectType(input!);
      if (customObjectName) {
        return `a custom ${customObjectName} object`;
      } else {
        return 'an object';
      }
    }
  } else if (typeof input === 'function') {
    return 'a function';
  } else {
    return fail('Unknown wrong type: ' + typeof input);
  }
}

/** Hacky method to try to get the constructor name for an object. */
export function tryGetCustomObjectType(input: object): string | null {
  if (input.constructor) {
    const funcNameRegex = /function\s+([^\s(]+)\s*\(/;
    const results = funcNameRegex.exec(input.constructor.toString());
    if (results && results.length > 1) {
      return results[1];
    }
  }
  return null;
}

/**
 * Helper method to throw an error that the provided argument did not pass
 * an instanceof check.
 */
export function invalidClassError(
  functionName: string,
  type: string,
  position: number,
  argument: unknown
): Error {
  const description = valueDescription(argument);
  return new FirestoreError(
    Code.INVALID_ARGUMENT,
    `Function ${functionName}() requires its ${ordinal(position)} ` +
      `argument to be a ${type}, but it was: ${description}`
  );
}

export function validatePositiveNumber(
  functionName: string,
  position: number,
  n: number
): void {
  if (n <= 0) {
    throw new FirestoreError(
      Code.INVALID_ARGUMENT,
      `Function ${functionName}() requires its ${ordinal(
        position
      )} argument to be a positive number, but it was: ${n}.`
    );
  }
}

/** Converts a number to its english word representation */
function ordinal(num: number): string {
  switch (num) {
    case 1:
      return 'first';
    case 2:
      return 'second';
    case 3:
      return 'third';
    default:
      return num + 'th';
  }
}

/**
 * Formats the given word as plural conditionally given the preceding number.
 */
function formatPlural(num: number, str: string): string {
  return `${num} ${str}` + (num === 1 ? '' : 's');
}
