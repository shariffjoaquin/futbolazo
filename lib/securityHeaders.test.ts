import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, HSTS, PERMISSIONS_POLICY, securityHeaders } from "./securityHeaders";

/** Directivas de la CSP como mapa: `{ "script-src": ["'self'", …] }`. */
function directives(csp: string): Record<string, string[]> {
  return Object.fromEntries(
    csp.split(";").map((d) => {
      const [name, ...values] = d.trim().split(/\s+/);
      return [name, values];
    }),
  );
}

describe("contentSecurityPolicy", () => {
  const prod = directives(contentSecurityPolicy(false));
  const dev = directives(contentSecurityPolicy(true));

  it("en producción no permite 'unsafe-eval'", () => {
    expect(contentSecurityPolicy(false)).not.toContain("unsafe-eval");
  });

  it("en desarrollo permite 'unsafe-eval' solo en scripts", () => {
    expect(dev["script-src"]).toContain("'unsafe-eval'");
    expect(contentSecurityPolicy(true).match(/unsafe-eval/g)).toHaveLength(1);
  });

  it("solo permite recursos del propio sitio (sin http:, https: ni comodines)", () => {
    for (const values of Object.values(prod)) {
      for (const v of values) expect(v).not.toMatch(/^(https?:|\*|\/\/)|\*/);
    }
    expect(prod["default-src"]).toEqual(["'self'"]);
    expect(prod["font-src"]).toEqual(["'self'"]);
    expect(prod["connect-src"]).toEqual(["'self'"]);
    expect(prod["img-src"]).toEqual(["'self'"]);
    expect(prod).not.toHaveProperty("worker-src");
  });

  it("no deja incrustar la página ni cargar plugins o cambiar la base", () => {
    expect(prod["frame-ancestors"]).toEqual(["'none'"]);
    expect(prod["object-src"]).toEqual(["'none'"]);
    expect(prod["base-uri"]).toEqual(["'self'"]);
    expect(prod["form-action"]).toEqual(["'self'"]);
  });

  it("fuerza https solo en producción", () => {
    expect(prod).toHaveProperty("upgrade-insecure-requests");
    expect(dev).not.toHaveProperty("upgrade-insecure-requests");
  });
});

describe("securityHeaders", () => {
  const headers = Object.fromEntries(securityHeaders(false).map((h) => [h.key, h.value]));

  it("incluye todas las cabeceras pedidas", () => {
    expect(headers).toEqual({
      "Content-Security-Policy": contentSecurityPolicy(false),
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": PERMISSIONS_POLICY,
      "Strict-Transport-Security": HSTS,
    });
  });

  it("cierra cámara, micrófono y geolocalización", () => {
    for (const feature of ["camera", "microphone", "geolocation"]) {
      expect(PERMISSIONS_POLICY.split(", ")).toContain(`${feature}=()`);
    }
  });

  it("HSTS de al menos un año, sin preload todavía", () => {
    const maxAge = Number(/max-age=(\d+)/.exec(HSTS)?.[1]);
    expect(maxAge).toBeGreaterThanOrEqual(31536000);
    expect(HSTS).not.toContain("preload");
  });
});
