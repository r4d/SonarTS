/*
 * SonarTS
 * Copyright (C) 2017-2019 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import { createService, FileCache } from "../../src/runner/languageService";
import * as nav from "../../src/utils/navigation";
import * as ts from "typescript";
import { Identifier, LanguageService } from "typescript";
import * as path from "path";
import { is } from "../../src/utils/nodes";

it("should return type information", () => {
  const file1 = path.join(__dirname, "fixtures/incremental-compilation-project/file1.ts");
  const file2 = path.join(__dirname, "fixtures/incremental-compilation-project/file2.ts");
  const cache = new FileCache();
  const service = createService([file1], {}, cache);
  expect(getType(service, file1, "x")).toBe("number");

  cache.newContent({
    file: file2,
    content: `export function foo() { return "0"; }`,
  });

  cache.newContent({
    file: file1,
    content: `
    import { foo } from "./file2";
    const x = foo();`,
  });

  expect(getType(service, file1, "x")).toBe("string");
});

function getType(service: LanguageService, file: string, identifierName: string) {
  const program = service.getProgram();
  const sourceFile = program.getSourceFile(file);
  const xNode = nav
    .descendants(sourceFile)
    .filter(descendant => is(descendant, ts.SyntaxKind.Identifier))
    .map(descendant => descendant as Identifier)
    .find(identifier => identifier.getText() == identifierName);

  const typeChecker = program.getTypeChecker();
  return typeChecker.typeToString(typeChecker.getTypeAtLocation(xNode));
}
