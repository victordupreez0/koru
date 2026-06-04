import {
  isValidUrl,
  ensureHttps,
  slugify,
  buildDefaultProfile,
  updateList,
  getFileSizeError,
  stripInlineAssetsForPersistence,
  isProjectAssetUrl,
  isProjectImageUrl,
  getLinkEntries,
  getSkillGroups,
} from '../../src/pages/profile/profileUtils.jsx';

describe('profileUtils', () => {
  describe('isValidUrl', () => {
    it('accepts https', () => expect(isValidUrl('https://example.com')).toBe(true));
    it('accepts http', () => expect(isValidUrl('http://example.com')).toBe(true));
    it('rejects empty', () => expect(isValidUrl('')).toBe(false));
    it('rejects non-url', () => expect(isValidUrl('not a url')).toBe(false));
    it('rejects ftp', () => expect(isValidUrl('ftp://example.com')).toBe(false));
  });

  describe('isProjectAssetUrl', () => {
    it('accepts data url', () => expect(isProjectAssetUrl('data:image/png;base64,x')).toBe(true));
    it('accepts blob url', () => expect(isProjectAssetUrl('blob:abc')).toBe(true));
    it('accepts https', () => expect(isProjectAssetUrl('https://example.com')).toBe(true));
    it('rejects empty', () => expect(isProjectAssetUrl('')).toBe(false));
  });

  describe('isProjectImageUrl', () => {
    it('accepts data image url', () => expect(isProjectImageUrl('data:image/png;base64,x')).toBe(true));
    it('accepts blob url', () => expect(isProjectImageUrl('blob:abc')).toBe(true));
    it('accepts https', () => expect(isProjectImageUrl('https://example.com')).toBe(true));
  });

  describe('ensureHttps', () => {
    it('returns empty for empty', () => expect(ensureHttps('')).toBe(''));
    it('prefixes naked domain', () => expect(ensureHttps('github.com/x')).toBe('https://github.com/x'));
    it('keeps https unchanged', () => expect(ensureHttps('https://x')).toBe('https://x'));
    it('keeps http unchanged', () => expect(ensureHttps('http://x')).toBe('http://x'));
    it('keeps data url unchanged', () => expect(ensureHttps('data:foo')).toBe('data:foo'));
  });

  describe('slugify', () => {
    it('lowercases and replaces spaces', () => expect(slugify('Hello World')).toBe('hello-world'));
    it('strips leading/trailing dashes', () => expect(slugify('--Hi--')).toBe('hi'));
    it('returns empty for empty', () => expect(slugify('')).toBe(''));
  });

  describe('updateList', () => {
    it('replaces the indexed item', () => {
      expect(updateList(['a', 'b', 'c'], 1, 'X')).toEqual(['a', 'X', 'c']);
    });
  });

  describe('getFileSizeError', () => {
    it('returns empty when within limit', () => expect(getFileSizeError({ size: 100 }, 1000, 'Image')).toBe(''));
    it('returns error when over', () => {
      const result = getFileSizeError({ size: 5000 }, 1000, 'Image');
      expect(result).toMatch(/Image is too large/);
    });
  });

  describe('getLinkEntries', () => {
    it('returns label/value pairs', () => {
      const entries = getLinkEntries({ github: 'g', behance: '', linkedin: 'l', website: '' });
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0]).toHaveLength(2);
    });
  });

  describe('getSkillGroups', () => {
    it('groups skills by category', () => {
      const groups = getSkillGroups({ technical: ['Go'], soft: [], interpersonal: [] });
      const tech = groups.find((g) => g.key === 'technical');
      expect(tech.items).toEqual(['Go']);
    });
  });

  describe('stripInlineAssetsForPersistence', () => {
    it('clears inline header photo and project assets', () => {
      const snap = {
        header: { photoUrl: 'data:image/png;base64,x' },
        projects: [{ mediaUrl: 'blob:y', projectUrl: 'https://keep.me' }],
      };
      const cleaned = stripInlineAssetsForPersistence(snap);
      expect(cleaned.header.photoUrl).toBe('');
      expect(cleaned.projects[0].mediaUrl).toBe('');
      expect(cleaned.projects[0].projectUrl).toBe('https://keep.me');
    });
  });

  describe('buildDefaultProfile', () => {
    it('uses session name and email', () => {
      const profile = buildDefaultProfile('student', { firstName: 'Alice', lastName: 'Smith', email: 'a@x.com' });
      expect(profile.header.fullName).toBe('Alice Smith');
      expect(profile.vanityUrlSlug).toBe('alice-smith');
      expect(profile.privacy.profilePublic).toBe(true);
    });

    it('falls back to email when no name', () => {
      const profile = buildDefaultProfile('student', { email: 'fallback@x.com' });
      expect(profile.vanityUrlSlug).toBe('fallback');
    });
  });
});
