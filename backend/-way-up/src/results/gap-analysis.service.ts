import { Injectable, NotFoundException } from '@nestjs/common';
import { ResultsRepository } from './results.repository';

@Injectable()
export class GapAnalysisService {
  constructor(private readonly resultsRepo: ResultsRepository) {}

  async analyzeGaps(userId: string, resultId: string, pathType: string) {
    const result = await this.resultsRepo.findOwned(resultId, userId);

    if (!result || !result.profile) {
      throw new NotFoundException('Wynik lub profil nie został znaleziony');
    }

    const profile = result.profile as any;
    const targetPath = profile.paths?.find((p: any) => p.type === pathType);

    if (!targetPath) {
      throw new NotFoundException('Nie znaleziono wskazanej ścieżki kariery');
    }

    const requiredSkills: string[] = profile.skills?.hard || [];
    const userAnswersText = JSON.stringify(result.answers || {});
    const acquiredSkills = requiredSkills.filter(skill => 
      userAnswersText.toLowerCase().includes(skill.toLowerCase())
    );

    const missingSkills = requiredSkills.filter(skill => !acquiredSkills.includes(skill));
    const matchPercentage = requiredSkills.length > 0 
      ? Math.round((acquiredSkills.length / requiredSkills.length) * 100) 
      : 50;

    return {
      ok: true,
      pathType,
      pathTitle: targetPath.title,
      matchPercentage,
      acquiredSkills,
      missingSkills,
      recommendation: missingSkills.length > 0 
        ? `Aby w pełni dopasować się do ścieżki ${targetPath.title}, warto w pierwszej kolejności skupić się na: ${missingSkills.slice(0, 2).join(', ')}.`
        : 'Masz świetne wstępne predyspozycje i umiejętności pod tę ścieżkę!'
    };
  }
}