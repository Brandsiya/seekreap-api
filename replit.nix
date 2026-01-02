{ pkgs }: {
  deps = [
    pkgs.nodejs_22
    pkgs.typescript
    pkgs.nodePackages.nodemon
  ];
}