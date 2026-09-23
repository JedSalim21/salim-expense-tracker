import {
  Show,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
} from "@clerk/react";
import heroImg from "./assets/hero.png";
import "./App.css";

function App() {
  return (
    <>
      <header className="app-header">
        <a className="brand" href="/">
          SalimSpend
        </a>
        <nav className="auth-controls" aria-label="Authentication">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button type="button" className="auth-button secondary">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" className="auth-button primary">
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <SignOutButton>
              <button type="button" className="auth-button secondary">
                Sign out
              </button>
            </SignOutButton>
            <UserButton />
          </Show>
        </nav>
      </header>

      <main className="app-main">
        <Show when="signed-out">
          <section className="auth-hero" aria-labelledby="auth-heading">
            <div className="auth-copy">
              <p className="eyebrow">Private spending workspace</p>
              <h1 id="auth-heading">Start your SalimSpend account</h1>
              <p className="lead">
                Create an account or return to your existing one with Clerk's
                secure email and Google authentication.
              </p>
              <div className="hero-actions" aria-label="Account actions">
                <SignUpButton mode="modal">
                  <button type="button" className="auth-button primary large">
                    Sign up
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button type="button" className="auth-button secondary large">
                    Sign in
                  </button>
                </SignInButton>
              </div>
              <p className="auth-methods">Email and Google available.</p>
            </div>

            <div className="auth-visual" aria-hidden="true">
              <img
                src={heroImg}
                className="hero-image"
                width="170"
                height="179"
                alt=""
              />
              <div className="visual-lines">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </section>
        </Show>

        <Show when="signed-in">
          <section
            className="signed-in-state"
            aria-labelledby="signed-in-heading"
          >
            <p className="eyebrow">Authenticated</p>
            <h1 id="signed-in-heading">You're signed in to SalimSpend.</h1>
            <p className="lead">Your account connection is ready.</p>
          </section>
        </Show>
      </main>
    </>
  );
}

export default App;
