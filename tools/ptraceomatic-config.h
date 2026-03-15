#define VVAR_PAGES 4
// Kernel 6.x+ uses 3 VDSO pages for 32-bit; older kernels use 2.
// Using 3 here is safe on older kernels (extra page is just zeroed).
#define VDSO_PAGES 3
