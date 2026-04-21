import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, extname } from 'path';

export class SkillsLoader {
  private skillsPath: string;

  constructor(skillsPath: string) {
    this.skillsPath = resolve(process.cwd(), skillsPath);
  }

  async loadSkills(): Promise<string> {
    if (!existsSync(this.skillsPath)) {
      console.log('⚠️  Skills folder not found, skipping');
      return '';
    }

    try {
      const files = await readdir(this.skillsPath);
      const markdownFiles = files.filter(f => extname(f) === '.md');

      if (markdownFiles.length === 0) {
        return '';
      }

      let skillsContent = '# Domain Knowledge & Review Guidelines\n\n';

      for (const file of markdownFiles) {
        const filePath = resolve(this.skillsPath, file);
        const content = await readFile(filePath, 'utf-8');
        skillsContent += `\n## ${file.replace('.md', '')}\n\n${content}\n`;
      }

      return skillsContent;
    } catch (error: any) {
      console.error('❌ Error loading skills:', error.message);
      return '';
    }
  }

  async hasSkills(): Promise<boolean> {
    if (!existsSync(this.skillsPath)) {
      return false;
    }

    try {
      const files = await readdir(this.skillsPath);
      return files.some(f => extname(f) === '.md');
    } catch {
      return false;
    }
  }
}
