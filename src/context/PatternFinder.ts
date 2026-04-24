import path from 'path';
import { glob as globAsync } from 'glob';

export class PatternFinder {
  async findSimilarFiles(
    filePath: string,
    repoRoot: string,
    maxResults: number = 5
  ): Promise<string[]> {
    const similarFiles = new Set<string>();

    const byNaming = await this.findByNamingPattern(filePath, repoRoot);
    byNaming.forEach(f => similarFiles.add(f));

    const siblings = await this.findSiblings(filePath, repoRoot);
    siblings.forEach(f => similarFiles.add(f));

    const byType = await this.findByTypeInModule(filePath, repoRoot);
    byType.forEach(f => similarFiles.add(f));

    similarFiles.delete(filePath);

    return Array.from(similarFiles).slice(0, maxResults);
  }

  private async findByNamingPattern(
    filePath: string,
    repoRoot: string
  ): Promise<string[]> {
    const fileName = path.basename(filePath);
    const fileExt = path.extname(fileName);
    const baseName = fileName.replace(fileExt, '');

    const patterns: string[] = [];

    const typeSuffixMatch = baseName.match(/\.(service|controller|model|component|util|helper|middleware|handler|repository)$/i);
    if (typeSuffixMatch) {
      const typeSuffix = typeSuffixMatch[0];
      patterns.push(`**/*${typeSuffix}${fileExt}`);
    }

    const parts = baseName.split(/[-_]/);
    if (parts.length > 1) {
      const prefix = parts[0];
      patterns.push(`**/${prefix}-*${fileExt}`);
      patterns.push(`**/${prefix}_*${fileExt}`);
    }

    const results = new Set<string>();
    for (const pattern of patterns) {
      try {
        const matches = await globAsync(pattern, {
          cwd: repoRoot,
          ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
          nodir: true
        });

        matches
          .map((m: string) => path.relative(repoRoot, path.resolve(repoRoot, m)))
          .forEach((m: string) => results.add(m));
      } catch (error) {
        continue;
      }
    }

    return Array.from(results);
  }

  private async findSiblings(
    filePath: string,
    repoRoot: string
  ): Promise<string[]> {
    const dirName = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const parentDir = path.dirname(dirName);

    if (parentDir === dirName || parentDir === '.') {
      return [];
    }

    try {
      const pattern = path.join(parentDir, '*', fileName);

      const matches = await globAsync(pattern, {
        cwd: repoRoot,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
        nodir: true
      });

      return matches.map((m: string) => path.relative(repoRoot, path.resolve(repoRoot, m)));
    } catch (error) {
      return [];
    }
  }

  private async findByTypeInModule(
    filePath: string,
    repoRoot: string
  ): Promise<string[]> {
    const dirName = path.dirname(filePath);
    const fileExt = path.extname(filePath);

    try {
      const pattern = path.join(dirName, `*${fileExt}`);

      const matches = await globAsync(pattern, {
        cwd: repoRoot,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
        nodir: true
      });

      return matches.map((m: string) => path.relative(repoRoot, path.resolve(repoRoot, m)));
    } catch (error) {
      return [];
    }
  }
}
