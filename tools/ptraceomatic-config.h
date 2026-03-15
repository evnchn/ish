#define VVAR_PAGES 4
// Kernel 6.x uses 3 pages for the 32-bit VDSO (up from 2 in kernel 5.x).
// Using 3 is safe on older kernels: the extra page is just zero padding,
// and the transplant code reads the actual [vdso] size from /proc/pid/maps.
#define VDSO_PAGES 3
// Kernel 6.13+ splits a [vvar_vclock] region (2 pages) out of [vvar].
#define VVAR_VCLOCK_PAGES 2
