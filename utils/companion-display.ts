const FALLBACK_GUIDE_IMAGES = [
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop',
];

export const TEST_COMPANION_ID = '30c6d267-22d1-4cd0-8bdc-46993c14c143';
export const TEST_COMPANION_EMAIL = 'test.companion.tirak@gmail.com';

const normalizeText = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

export const isTestCompanionId = (id: unknown): boolean => {
  return normalizeText(id) === TEST_COMPANION_ID;
};

export const isTestCompanion = (companion: any): boolean => {
  const email = normalizeText(companion?.email).toLowerCase();
  const displayName = getCompanionDisplayName(companion).toLowerCase();

  return isTestCompanionId(companion?.id) || email === TEST_COMPANION_EMAIL || displayName === 'test companion';
};

export const getCompanionDisplayName = (companion: any): string => {
  return (
    normalizeText(companion?.displayName) ||
    normalizeText(companion?.name) ||
    [normalizeText(companion?.firstName), normalizeText(companion?.lastName)].filter(Boolean).join(' ') ||
    'Local Guide'
  );
};

export const getCompanionLocation = (companion: any): string => {
  const regions = Array.isArray(companion?.regions) ? companion.regions.filter(Boolean) : [];
  return normalizeText(companion?.location) || normalizeText(regions[0]) || 'Thailand';
};

export const getCompanionServices = (companion: any): string[] => {
  if (Array.isArray(companion?.services) && companion.services.length > 0) {
    return companion.services;
  }

  if (Array.isArray(companion?.specialization) && companion.specialization.length > 0) {
    return companion.specialization;
  }

  if (Array.isArray(companion?.categories) && companion.categories.length > 0) {
    return companion.categories;
  }

  if (isTestCompanion(companion)) {
    return ['Temple walks', 'Market tasting'];
  }

  return ['Local experiences'];
};

export const getCompanionImage = (companion: any): string => {
  const profileImage = normalizeText(companion?.profileImage);
  if (profileImage) return profileImage;

  const gallery = Array.isArray(companion?.gallery) ? companion.gallery : [];
  const galleryImage = gallery.find((image: unknown) => normalizeText(image));
  if (galleryImage) return normalizeText(galleryImage);

  if (isTestCompanion(companion)) {
    return FALLBACK_GUIDE_IMAGES[0];
  }

  return '';
};

export const getCompanionGallery = (companion: any): string[] => {
  const gallery = Array.isArray(companion?.gallery)
    ? companion.gallery.filter((image: unknown) => normalizeText(image))
    : [];

  const displayImage = getCompanionImage(companion);
  return gallery.length > 0 ? gallery : displayImage ? [displayImage] : [];
};
