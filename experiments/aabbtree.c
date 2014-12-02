#include <stdio.h>

static const int MAX_NODE_COUNT = 3;
static const int NODE_NULL      = -1;

struct AABB {
  float x1;
  float y1;
  float z1;
  float x2;
  float y2;
  float z2;
};

struct Node {
  struct AABB aabb;
  union {
    int parent;
    int next; 
  };
  union {
    struct {
      int left;
      int right; 
    };
    void *userData;
  };
  int height;
};

struct AABBTree {
  struct Node nodes[MAX_NODE_COUNT];
  int freeIndex;
};

void initializeTree (struct AABBTree tree) {
  for (int i = 0; i < MAX_NODE_COUNT; ++i) {
    //initialize AABBs
    tree.nodes[i].aabb.x1 = 0; 
    tree.nodes[i].aabb.y1 = 0; 
    tree.nodes[i].aabb.z1 = 0; 
    tree.nodes[i].aabb.x2 = 0; 
    tree.nodes[i].aabb.y2 = 0; 
    tree.nodes[i].aabb.z2 = 0; 

    //initialize the free list values -- must set final value to null below
    tree.nodes[i].next   = i + 1;
    tree.nodes[i].height = NODE_NULL;
  }

  //final node in the array has no next index -- list is full if reached
  tree.nodes[MAX_NODE_COUNT - 1].next = NODE_NULL;

  //set the initial free index
  tree.freeIndex = 0;
}

void printNode (int index, struct Node node) {
  printf("node at: %d\n", index);
  printf("x1: %f, y1: %f, z1: %f\n", node.aabb.x1, node.aabb.y1, node.aabb.z1);
  printf("x2: %f, y2: %f, z2: %f\n", node.aabb.x2, node.aabb.y2, node.aabb.z2);
  printf("next-> %d\n\n", node.next);
}

void printTree (struct AABBTree tree) {
  for (int i = 0; i < MAX_NODE_COUNT; ++i) {
    printNode(i, tree.nodes[i]); 
  }
  printf("freeIndex: %d\n", tree.freeIndex);
}

int main () {
  struct AABBTree tree;
  initializeTree(tree);

  printTree(tree);
}
