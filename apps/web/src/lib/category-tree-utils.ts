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
