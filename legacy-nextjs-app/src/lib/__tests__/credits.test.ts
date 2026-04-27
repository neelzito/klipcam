import { describe, it, expect } from 'vitest';
import { estimateCredits, CREDIT_COSTS } from '../credits';

describe('Credits System', () => {
  it('should estimate correct credits for image base', () => {
    expect(estimateCredits('imageBase')).toBe(1);
  });

  it('should estimate correct credits for image premium', () => {
    expect(estimateCredits('imagePremium')).toBe(4);
  });

  it('should estimate correct credits for upscale', () => {
    expect(estimateCredits('upscale')).toBe(4);
  });

  it('should estimate correct credits for video base', () => {
    expect(estimateCredits('videoBase')).toBe(18);
  });

  it('should estimate correct credits for spider effect', () => {
    expect(estimateCredits('spider')).toBe(25);
  });

  it('should have consistent credit costs', () => {
    expect(CREDIT_COSTS.imageBase).toBe(1);
    expect(CREDIT_COSTS.imagePremium).toBe(4);
    expect(CREDIT_COSTS.upscale).toBe(4);
    expect(CREDIT_COSTS.videoBase).toBe(18);
    expect(CREDIT_COSTS.spider).toBe(25);
  });
});