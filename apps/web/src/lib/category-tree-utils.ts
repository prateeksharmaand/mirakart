import type { CategoryNode } from "../types/catalog";

export function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  function walk(list: CategoryNode[]) {
    for (const node of list) {
      out.push(node);
      if (node.children.length > 0) walk(node.children);
    }
  }
  walk(nodes);
  return out;
}

export function findCategoryNode(nodes: CategoryNode[], id: string): CategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children.length > 0) {
      const found = findCategoryNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function collectDescendantIds(node: CategoryNode): string[] {
  const ids: string[] = [];
  function walk(children: CategoryNode[]) {
    for (const child of children) {
      ids.push(child.id);
      if (child.children.length > 0) walk(child.children);
    }
  }
  walk(node.children);
  return ids;
}

// A category page (or a checked category filter) should include products
// filed under any of its subcategories, not just products tagged with the
// exact category id -- otherwise a parent category with no directly-tagged
// products of its own appears empty even when its subcategories have stock.
export function expandWithDescendants(tree: CategoryNode[], ids: string[]): string[] {
  const result = new Set<string>();
  for (const id of ids) {
    const node = findCategoryNode(tree, id);
    if (node) {
      result.add(node.id);
      for (const descendantId of collectDescendantIds(node)) result.add(descendantId);
    } else {
      result.add(id);
    }
  }
  return [...result];
}
