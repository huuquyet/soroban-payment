# You can find the new timestamped tags here: https://hub.docker.com/r/gitpod/workspace-full/tags
FROM gitpod/workspace-full:2024-01-10-10-45-39

RUN mkdir -p ~/.local/bin

RUN curl -L https://github.com/stellar/soroban-tools/releases/download/v20.2.0/soroban-cli-20.2.0-x86_64-unknown-linux-gnu.tar.gz | tar xz -C ~/.local/bin soroban
RUN chmod +x ~/.local/bin/soroban
RUN echo "source <(soroban completion --shell bash)" >> ~/.bashrc

RUN curl -L https://github.com/mozilla/sccache/releases/download/v0.7.5/sccache-v0.7.5-x86_64-unknown-linux-musl.tar.gz | tar xz --strip-components 1 -C ~/.local/bin sccache-v0.7.5-x86_64-unknown-linux-musl/sccache
RUN chmod +x ~/.local/bin/sccache

RUN curl -L https://github.com/watchexec/cargo-watch/releases/download/v8.5.2/cargo-watch-v8.5.2-x86_64-unknown-linux-gnu.tar.xz | tar xJ --strip-components 1 -C ~/.local/bin cargo-watch-v8.5.2-x86_64-unknown-linux-gnu/cargo-watch

ENV RUSTC_WRAPPER=sccache
ENV SCCACHE_CACHE_SIZE=5G
ENV SCCACHE_DIR=/workspace/.sccache

# Remove the existing rustup installation before updating due to:
# https://github.com/gitpod-io/workspace-images/issues/933#issuecomment-1272616892
RUN rustup self uninstall -y
RUN rm -rf .rustup
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- --default-toolchain none -y

RUN rustup install 1.75
RUN rustup target add --toolchain 1.75 wasm32-unknown-unknown
RUN rustup component add --toolchain 1.75 rust-src
RUN rustup default 1.75

RUN sudo apt-get update && sudo apt-get install -y binaryen

# Enable sparse registry support, which will cause cargo to download only what
# it needs from crates.io, rather than the entire registry.
ENV CARGO_REGISTRIES_CRATES_IO_PROTOCOL=sparse
