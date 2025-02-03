let
    pkgs = import <nixpkgs> {};
    unstable = import <nixpkgs> { config = { allowUnfree = true; }; };
in
    pkgs.mkShell rec {
        experimental-features = [ "nix-command" "flakes" ];
        nativeBuildInputs = with pkgs.buildPackages; [ bun git ];
        shellHook = ''
          export IS_NIX_SHELL=true
        '';
}
