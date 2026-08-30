import assert from "node:assert/strict";
import test from "node:test";

test("a plain click inside an internal course link starts route progress", async () => {
  const navigation = await import("../lib/navigation-progress.ts").catch(() => null);
  assert.ok(navigation, "the shared route-progress click resolver should exist");

  const anchor = {
    getAttribute(name) {
      return name === "href" ? "/courses/van-phong-hanh-chinh" : null;
    },
    hasAttribute() {
      return false;
    },
  };
  const target = {
    closest(selector) {
      return selector === "a[href]" ? anchor : null;
    },
  };

  assert.equal(navigation.getInternalNavigationHref({
    altKey: false,
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    target,
  }), "/courses/van-phong-hanh-chinh");
});

test("a modified course-card click leaves route progress idle", async () => {
  const { getInternalNavigationHref } = await import("../lib/navigation-progress.ts");
  const anchor = {
    getAttribute(name) {
      return name === "href" ? "/courses/van-phong-hanh-chinh" : null;
    },
    hasAttribute() {
      return false;
    },
  };

  assert.equal(getInternalNavigationHref({
    altKey: false,
    button: 0,
    ctrlKey: true,
    metaKey: false,
    shiftKey: false,
    target: { closest: () => anchor },
  }), null);
});

test("an internal link with search parameters resolves to its route pathname", async () => {
  const { getInternalNavigationHref } = await import("../lib/navigation-progress.ts");
  const anchor = {
    getAttribute(name) {
      return name === "href" ? "/courses?view=hsk" : null;
    },
    hasAttribute() {
      return false;
    },
  };

  assert.equal(getInternalNavigationHref({
    altKey: false,
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    target: { closest: () => anchor },
  }), "/courses");
});
