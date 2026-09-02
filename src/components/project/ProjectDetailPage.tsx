// @ts-nocheck
/* Dynamic port of prototype/project-maalot.html — markup/CSS/animations are
   preserved 1:1 (same convention as TurningPointHome.tsx/TurningPointAbout.tsx:
   "// @ts-nocheck ... Do not redesign or refactor"). The ONLY thing this
   component changes vs. the original static page is WHERE content comes from:
   every text/image that used to be hardcoded HTML is now read from
   projectsService/projectImagesService via a slug (or, in the dashboard's
   preview route, from an in-memory draft — see previewProject/previewImages).

   Header/mobile-menu/footer-section/bottom-bar below are copied inline from
   TurningPointAbout.tsx, same "global__..." data-editor-id values — this is
   the existing project convention (every page duplicates the shared chrome
   rather than importing one shared component), and it's what makes any
   already-saved global override in Supabase's editor_overrides table apply
   here automatically, with no extra code. */
import { useEffect, useLayoutEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import "../../styles/turningpoint.css";
import "../../styles/project-detail.css";
import type { Project } from "@/types/project";
import type { ProjectImage } from "@/types/project-image";
import * as projectsService from "@/services/projectsService";
import * as projectImagesService from "@/services/projectImagesService";
import { rescanEditorRuntime } from "@/lib/editor/editor-runtime";
import { attachProjectDetailEffects } from "@/lib/project-detail-effects";

type PageState =
  | { status: "loading" }
  | { status: "notfound" }
  | {
      status: "ready";
      project: Project;
      images: ProjectImage[];
      adjacent: { prev: Project | null; next: Project | null };
    };

/**
 * Renders exactly like the original <Link to="/projects/$slug">: same
 * className/style/data-editor-id, same visible title text — so the public
 * route's markup and behavior are byte-identical to before this component
 * existed. The only branch is which mode is rendering: public mode (no
 * onAdjacentNavigate) keeps the real router Link; preview mode swaps in a
 * plain button that hands the adjacent project back to the caller instead
 * of navigating to the public route (which would silently leave the
 * preview context — see ProjectDetailPageProps.onAdjacentNavigate).
 */
function AdjacentNavLink({
  project,
  className,
  style,
  dataEditorId,
  onAdjacentNavigate,
}: {
  project: Project;
  className: string;
  style: React.CSSProperties;
  dataEditorId: string;
  onAdjacentNavigate?: (project: Project) => void;
}) {
  if (onAdjacentNavigate) {
    return (
      <button
        type="button"
        className={className}
        style={style}
        data-editor-id={dataEditorId}
        onClick={() => onAdjacentNavigate(project)}
      >
        {project.title}
      </button>
    );
  }
  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      className={className}
      style={style}
      data-editor-id={dataEditorId}
    >
      {project.title}
    </Link>
  );
}

export interface ProjectDetailPageProps {
  /** Public route mode: fetch by slug (draft projects need `?preview=1` in the URL + preview:true). */
  slug?: string;
  /** Dashboard preview mode: render this data directly, bypassing the fetch entirely (works for
      unsaved drafts and brand-new projects that don't exist in the mock store yet). */
  previewProject?: Project;
  previewImages?: ProjectImage[];
  /** Preview-mode only: called instead of routing to /projects/:slug when the viewer
      clicks the prev/next nav at the bottom of the page — keeps the click inside the
      preview context (admin/preview.tsx swaps in the adjacent project's real, saved
      data in place) instead of bouncing out to the public route. Ignored in public
      route mode, where prev/next always behaves like a normal site link. */
  onAdjacentNavigate?: (project: Project) => void;
}

export default function ProjectDetailPage({
  slug,
  previewProject,
  previewImages,
  onAdjacentNavigate,
}: ProjectDetailPageProps) {
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useLayoutEffect(() => {
    document.documentElement.classList.add("anim-ready");
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "he");
    document.body.classList.add("pm-body");
    return () => {
      document.body.classList.remove("pm-body");
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (previewProject) {
      setState({
        status: "ready",
        project: previewProject,
        images: previewImages ?? [],
        adjacent: { prev: null, next: null },
      });
      // Preview mode must not skip getAdjacentProjects() just because there's
      // no real fetch-by-slug happening — the prev/next nav should reflect
      // the real, currently-published neighbors, same as the public route.
      // Fetched separately (not blocking the initial "ready" state above) so
      // an unsaved draft or brand-new project still renders immediately;
      // this only ever fills in `adjacent`, never project/images.
      (async () => {
        const adjacentRes = await projectsService.getAdjacentProjects(previewProject.slug);
        if (cancelled || !adjacentRes.ok) return;
        setState((prev) =>
          prev.status === "ready" ? { ...prev, adjacent: adjacentRes.data } : prev,
        );
      })();
      return () => {
        cancelled = true;
      };
    }

    if (!slug) return;
    setState({ status: "loading" });

    (async () => {
      const isPreview =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("preview") === "1";
      const projectRes = await projectsService.getProjectBySlug(slug, { preview: isPreview });
      if (cancelled) return;
      if (!projectRes.ok) {
        setState({ status: "notfound" });
        return;
      }
      const project = projectRes.data;
      const [mainRes, brandRes, secondaryRes, adjacentRes] = await Promise.all([
        projectImagesService.getProjectImages(project.id, "main_gallery"),
        projectImagesService.getProjectImages(project.id, "brand_colors"),
        projectImagesService.getProjectImages(project.id, "secondary_gallery"),
        projectsService.getAdjacentProjects(project.slug),
      ]);
      if (cancelled) return;
      const images = [
        ...(mainRes.ok ? mainRes.data : []),
        ...(brandRes.ok ? brandRes.data : []),
        ...(secondaryRes.ok ? secondaryRes.data : []),
      ];
      setState({
        status: "ready",
        project,
        images,
        adjacent: adjacentRes.ok ? adjacentRes.data : { prev: null, next: null },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, previewProject, previewImages]);

  const readyProjectId = state.status === "ready" ? state.project.id : null;
  const readyImagesCount = state.status === "ready" ? state.images.length : 0;

  // Re-scan the visual editor's overrides AFTER our own async content lands in
  // the DOM — __root.tsx's route-change rescan can't know when that happens,
  // since it fires on pathname change alone. Safe to call repeatedly.
  useEffect(() => {
    if (state.status === "ready") rescanEditorRuntime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyProjectId, readyImagesCount]);

  // Attach the ported scroll effects only once real content (and therefore
  // #pmHeroZone/#pmLastImgBox/etc) exists, and fully clean them up (listeners,
  // observers, rAF) whenever we leave this project or unmount — see
  // src/lib/project-detail-effects.ts for why this can't just be `key={slug}`.
  useEffect(() => {
    if (state.status !== "ready") return;
    const cleanup = attachProjectDetailEffects();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyProjectId]);

  const scopeKey = state.status === "ready" ? state.project.slug || state.project.id : "loading";
  const eid = (suffix: string) => `page-project-${scopeKey}__${suffix}`;

  const mainImages =
    state.status === "ready"
      ? state.images
          .filter((i) => i.gallery_type === "main_gallery")
          .sort((a, b) => a.sort_order - b.sort_order)
      : [];
  const brandImages =
    state.status === "ready"
      ? state.images
          .filter((i) => i.gallery_type === "brand_colors")
          .sort((a, b) => a.sort_order - b.sort_order)
      : [];
  const secondaryImages =
    state.status === "ready"
      ? state.images
          .filter((i) => i.gallery_type === "secondary_gallery")
          .sort((a, b) => a.sort_order - b.sort_order)
      : [];

  return (
    <>
      <header>
        <div className="logo-wrap">
          <svg viewBox="0 0 148 57" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8.39204 16.2745H10.1725C11.6354 16.2745 12.2225 16.8231 12.2225 18.2379V19.7393C12.2225 20.0665 11.9915 20.2975 11.6643 20.2975C11.3371 20.2975 11.1157 20.0761 11.1157 19.7393V18.2379C11.1157 17.5449 10.8462 17.2177 10.1821 17.2177H9.59507V19.2003C9.59507 19.9799 9.14273 20.2975 8.55565 20.2975C8.33429 20.2975 8.16105 20.2782 7.97819 20.2205C7.77608 20.1531 7.64134 19.951 7.68947 19.7104C7.73759 19.4794 7.93007 19.3447 8.17068 19.3543C8.20918 19.3543 8.23805 19.3543 8.26692 19.3543C8.44016 19.3543 8.5364 19.2581 8.5364 18.9212V17.1985H8.40166C8.12256 17.1985 7.93007 17.006 7.93007 16.7269C7.93007 16.4478 8.12256 16.2649 8.40166 16.2649L8.39204 16.2745Z"
              fill="white"
            ></path>
            <path
              d="M17.5742 20.259H14.5137C14.2442 20.259 14.0518 20.0665 14.0518 19.7874C14.0518 19.5083 14.2442 19.3254 14.5137 19.3254H16.3616V18.2668C16.3616 17.6027 16.1113 17.1407 15.4473 17.1407C15.197 17.1407 14.9757 17.1888 14.764 17.2755C14.4945 17.3717 14.225 17.2755 14.1288 17.0541C14.0229 16.8039 14.148 16.544 14.4367 16.4285C14.8024 16.2745 15.197 16.2072 15.582 16.2072C16.862 16.2072 17.4587 16.9097 17.4587 18.1898V19.3351H17.5646C17.8437 19.3351 18.0266 19.5179 18.0266 19.797C18.0266 20.0761 17.8437 20.2686 17.5646 20.2686L17.5742 20.259Z"
              fill="white"
            ></path>
            <path
              d="M19.7393 18.1032V16.804C19.7393 16.4767 19.9606 16.2457 20.2878 16.2457C20.6151 16.2457 20.846 16.4671 20.846 16.804V18.1032C20.846 18.4304 20.6247 18.6711 20.2975 18.6711C19.9702 18.6711 19.7393 18.4497 19.7393 18.1032Z"
              fill="white"
            ></path>
            <path
              d="M27.0445 18.1514C27.0445 19.5373 26.265 20.3265 24.9657 20.3265C23.6664 20.3265 22.8291 19.5373 22.8291 18.1514V16.8136C22.8291 16.4768 23.0505 16.2458 23.3873 16.2458C23.7242 16.2458 23.9359 16.4672 23.9359 16.8136V18.1514C23.9359 18.931 24.3112 19.4026 24.9657 19.4026C25.6201 19.4026 25.957 18.9406 25.957 18.1514C25.957 17.5547 25.7645 17.1601 25.3218 17.1601C25.2255 17.1601 25.1293 17.189 25.033 17.2082C24.7924 17.2564 24.5711 17.1505 24.5037 16.9388C24.4267 16.6982 24.5326 16.4575 24.7732 16.3517C25.0234 16.2554 25.2255 16.2169 25.4661 16.2169C26.3804 16.2169 27.0445 16.804 27.0445 18.1514Z"
              fill="white"
            ></path>
            <path
              d="M32.8664 18.2283V19.7393C32.8664 20.0665 32.6451 20.2975 32.3082 20.2975C31.9714 20.2975 31.7596 20.0761 31.7596 19.7393V18.2668C31.7596 17.5353 31.4324 17.2081 30.7491 17.2081H30.0658V19.7296C30.0658 20.0569 29.8444 20.2878 29.5172 20.2878C29.19 20.2878 28.959 20.0665 28.959 19.7296V16.8231C28.959 16.467 29.1611 16.2649 29.4979 16.2649H30.8453C32.1927 16.2649 32.8664 16.852 32.8664 18.209V18.2283Z"
              fill="white"
            ></path>
            <path
              d="M2.81055 29.0364V26.0818C2.81055 25.7257 3.02228 25.5236 3.388 25.5236H4.75464C6.10204 25.5236 6.74686 26.0337 6.74686 27.3137V29.0364C6.74686 29.3348 6.57362 29.508 6.27527 29.508H3.28213C2.98378 29.508 2.81055 29.3348 2.81055 29.0364ZM5.65932 28.5745V27.4292C5.65932 26.7362 5.39947 26.4475 4.74502 26.4475H3.89809V28.5745H5.65932Z"
              fill="white"
            ></path>
            <path
              d="M8.73926 27.3425V26.0432C8.73926 25.716 8.96062 25.485 9.28784 25.485C9.61507 25.485 9.84605 25.7064 9.84605 26.0432V27.3425C9.84605 27.6697 9.62469 27.9103 9.29747 27.9103C8.97024 27.9103 8.73926 27.689 8.73926 27.3425Z"
              fill="white"
            ></path>
            <path
              d="M13.7912 29.508C13.5217 29.4406 13.3677 29.2193 13.4158 28.9594C13.4543 28.7381 13.6564 28.5841 13.897 28.5937C13.974 28.6033 14.0318 28.6033 14.0895 28.6033C14.4167 28.6033 14.5707 28.4205 14.5707 27.7564V26.4571H12.2224C11.9337 26.4571 11.7412 26.2646 11.7412 25.9855C11.7412 25.7064 11.9337 25.5236 12.2224 25.5236H15.1001C15.4465 25.5236 15.6486 25.7353 15.6486 26.101V27.8526C15.6486 29.2289 14.9942 29.5561 14.2243 29.5561C14.0895 29.5561 13.9452 29.5465 13.7815 29.4984L13.7912 29.508ZM11.8278 27.7757C11.8278 27.4388 12.0492 27.2078 12.3764 27.2078C12.7036 27.2078 12.925 27.4292 12.925 27.7757V29.9989C12.925 30.3261 12.7036 30.5667 12.3764 30.5667C12.0492 30.5667 11.8278 30.3357 11.8278 29.9989V27.7757Z"
              fill="white"
            ></path>
            <path
              d="M21.712 27.4966C21.712 28.8054 20.942 29.5754 19.6812 29.5754C18.4205 29.5754 17.6602 28.8054 17.6602 27.4966V26.1395C17.6602 25.7546 17.8911 25.5236 18.2857 25.5236H19.7101C21.0094 25.5236 21.7216 26.2262 21.7216 27.4966H21.712ZM19.6812 28.6418C20.2587 28.6418 20.5956 28.1991 20.5956 27.4966C20.5956 26.8421 20.2876 26.4571 19.6812 26.4571H18.7669V27.4966C18.7669 28.2087 19.0942 28.6418 19.6812 28.6418Z"
              fill="white"
            ></path>
            <path
              d="M27.1403 26.0624V26.842C27.1403 28.4781 26.4954 29.556 23.9065 29.8062C23.5793 29.8351 23.3387 29.6715 23.3194 29.3828C23.3002 29.1133 23.4927 28.9016 23.8006 28.8631C23.9643 28.8438 24.1182 28.8246 24.2626 28.8053L23.56 26.2357C23.4638 25.8603 23.6082 25.562 23.9258 25.4946C24.253 25.4176 24.5417 25.6197 24.638 25.9951L25.2635 28.5551C25.8699 28.2856 26.0335 27.8044 26.0335 26.8324V26.0528C26.0335 25.7159 26.2548 25.485 26.5917 25.485C26.9285 25.485 27.1403 25.7159 27.1403 26.0528V26.0624Z"
              fill="white"
            ></path>
            <path
              d="M29.498 25.5236H30.8742C32.2409 25.5236 32.8761 26.1492 32.8761 27.5928V28.9787C32.8761 29.3059 32.6547 29.5369 32.3275 29.5369C32.0003 29.5369 31.7789 29.3155 31.7789 28.9787V27.6505C31.7789 26.8036 31.4709 26.4571 30.7395 26.4571H29.5076C29.2189 26.4571 29.0264 26.2646 29.0264 25.9855C29.0264 25.7064 29.2189 25.5236 29.5076 25.5236H29.498ZM29.6712 27.2367C29.9984 27.2367 30.2198 27.4677 30.2198 27.8045V28.9787C30.2198 29.3059 29.9984 29.5369 29.6712 29.5369C29.344 29.5369 29.1226 29.3155 29.1226 28.9787V27.8045C29.1226 27.4677 29.344 27.2367 29.6712 27.2367Z"
              fill="white"
            ></path>
            <path
              d="M3.11825 34.8493L1.81898 38.3717C1.70349 38.6893 1.41476 38.8818 1.10679 38.7856C0.789187 38.6893 0.644823 38.391 0.779563 38.006L1.85748 35.061H0.481212C0.192485 35.061 0 34.8589 0 34.5798C0 34.3007 0.202109 34.0986 0.481212 34.0986H2.65629C3.07976 34.0986 3.27224 34.4066 3.11825 34.8493Z"
              fill="white"
            ></path>
            <path
              d="M10.2494 35.2825V39.238C10.2494 39.5653 10.028 39.7962 9.70078 39.7962C9.37356 39.7962 9.14258 39.5749 9.14258 39.238V35.2825C9.14258 34.9552 9.36393 34.7243 9.70078 34.7243C10.0376 34.7243 10.2494 34.9456 10.2494 35.2825Z"
              fill="white"
            ></path>
            <path
              d="M13.4161 35.2825V38.2179C13.4161 38.5451 13.1948 38.7761 12.8675 38.7761C12.5403 38.7761 12.3093 38.5547 12.3093 38.2179V35.2825C12.3093 34.9552 12.5307 34.7243 12.8675 34.7243C13.2044 34.7243 13.4161 34.9456 13.4161 35.2825Z"
              fill="white"
            ></path>
            <path
              d="M15.2539 38.2756C15.2539 38.0062 15.456 37.8137 15.7447 37.8137H16.1971V36.1391C16.1971 35.8311 16.1201 35.706 15.9372 35.706C15.8795 35.706 15.7736 35.7156 15.7062 35.7156C15.5138 35.7156 15.3405 35.5905 15.3405 35.2921C15.3405 34.9938 15.5908 34.7339 16.2067 34.7339C16.9381 34.7339 17.2942 35.1574 17.2942 35.8888V38.2756C17.2942 38.574 17.1306 38.7472 16.8227 38.7472H15.7447C15.456 38.7472 15.2539 38.5451 15.2539 38.2756Z"
              fill="white"
            ></path>
            <path
              d="M20.4901 38.3526L20.4323 37.9099H20.4035C20.2399 38.5355 19.903 38.7761 19.5373 38.7761H19.5277C19.2197 38.7761 19.0176 38.5836 19.0176 38.2564C19.0176 37.9291 19.2389 37.7174 19.5758 37.7174H19.6239C20.0185 37.7174 20.3072 37.4864 20.3072 36.8897V36.0909C20.3072 35.8022 20.211 35.6963 20.0089 35.6963C19.9511 35.6963 19.8934 35.7059 19.8068 35.7059C19.6143 35.7059 19.4025 35.5904 19.4025 35.2825C19.4025 34.8782 19.8164 34.7243 20.2687 34.7243C21.0964 34.7243 21.3948 35.0996 21.3948 35.9177V38.2371C21.3948 38.5547 21.26 38.7761 20.9617 38.7761C20.7018 38.7761 20.5286 38.6317 20.4805 38.3526H20.4901Z"
              fill="white"
            ></path>
            <path
              d="M27.4483 36.7358C27.4483 38.0447 26.6783 38.8146 25.4176 38.8146C24.1568 38.8146 23.3965 38.0447 23.3965 36.7358V35.3788C23.3965 34.9938 23.6275 34.7628 24.0221 34.7628H25.4464C26.7457 34.7628 27.4579 35.4654 27.4579 36.7358H27.4483ZM25.4176 37.8811C25.995 37.8811 26.3319 37.4383 26.3319 36.7358C26.3319 36.0813 26.0239 35.6964 25.4176 35.6964H24.5033V36.7358C24.5033 37.448 24.8305 37.8811 25.4176 37.8811Z"
              fill="white"
            ></path>
            <path
              d="M32.6936 38.7471H29.6331C29.3636 38.7471 29.1711 38.5546 29.1711 38.2755C29.1711 37.9964 29.3636 37.8136 29.6331 37.8136H31.481V36.7549C31.481 36.0908 31.2307 35.6289 30.5667 35.6289C30.3164 35.6289 30.0951 35.677 29.8833 35.7636C29.6139 35.8599 29.3444 35.7636 29.2481 35.5423C29.1423 35.292 29.2674 35.0322 29.5561 34.9167C29.9218 34.7627 30.3164 34.6953 30.7014 34.6953C31.9814 34.6953 32.5781 35.3979 32.5781 36.6779V37.8232H32.684C32.9631 37.8232 33.146 38.0061 33.146 38.2852C33.146 38.5643 32.9631 38.7568 32.684 38.7568L32.6936 38.7471Z"
              fill="white"
            ></path>
            <path
              d="M99.293 4.35008H102.604V23.9835H106.867V0.0865479H99.293V4.35008Z"
              fill="white"
            ></path>
            <path
              d="M96.5504 11.2796C95.0779 11.2796 93.8845 12.473 93.8845 13.9455C93.8845 15.418 95.0779 16.6114 96.5504 16.6114C98.0229 16.6114 99.2164 15.418 99.2164 13.9455C99.2164 12.473 98.0229 11.2796 96.5504 11.2796Z"
              fill="white"
            ></path>
            <path
              d="M50.0556 19.7297H45.0798V23.9836H54.3191V4.35013H67.4273V24.0124H71.6812V0.0865936H50.0556V19.7297Z"
              fill="white"
            ></path>
            <path
              d="M147.78 0.00962446H140.09V4.26354H143.574L143.69 14.7636C143.718 17.4487 141.438 19.7489 138.714 19.7874L138.781 24.0413C143.892 23.9644 148.001 19.7874 147.953 14.7155L147.79 0L147.78 0.00962446Z"
              fill="white"
            ></path>
            <path
              d="M134.2 2.22316V0.096199H112.738V4.35011H129.956C129.956 4.42711 129.956 4.5041 129.956 4.5811C130.043 12.627 130.091 17.4872 121.958 20.4322L123.412 24.4359C134.383 20.4611 134.306 12.7328 134.22 4.5426C134.22 3.78228 134.2 3.01234 134.2 2.22316Z"
              fill="white"
            ></path>
            <path
              d="M45.0608 33.9447H64.752V53.6359H69.0155V29.6811H45.0608V33.9447Z"
              fill="white"
            ></path>
            <path
              d="M44.8202 51.1431C43.3477 51.1431 42.1543 52.3366 42.1543 53.8091C42.1543 55.2816 43.3477 56.475 44.8202 56.475C46.2927 56.475 47.4861 55.2816 47.4861 53.8091C47.4861 52.3366 46.2927 51.1431 44.8202 51.1431Z"
              fill="white"
            ></path>
            <path
              d="M87.8887 43.3379L96.358 43.2898L96.3388 39.0358L92.1522 39.0551V33.8195H105.559V38.1312C105.559 44.3292 100.612 49.3819 94.5198 49.3819H88.0042V53.6358H94.5198C102.951 53.6358 109.813 46.6775 109.813 38.1312V29.5656H87.8887V43.3475V43.3379Z"
              fill="white"
            ></path>
            <path
              d="M112.661 46.4658V53.6455H116.915V46.4658C116.915 39.5171 121.862 33.8677 127.954 33.8677H132.083V49.3723H124.884V53.6262H136.347V29.6041H127.954C119.523 29.6041 112.661 37.1688 112.661 46.4658Z"
              fill="white"
            ></path>
            <path
              d="M74.4434 29.6427V33.8966H77.9274L78.0429 44.3967C78.0717 47.0818 75.7908 49.382 73.0671 49.4205L73.1345 53.6744C78.245 53.5974 82.3545 49.4205 82.3064 44.3485L82.1524 29.6331H74.4627L74.4434 29.6427Z"
              fill="white"
            ></path>
            <path
              d="M45.0608 45.975H52.7121V53.6359H56.9756V41.721H45.0608V45.975Z"
              fill="white"
            ></path>
            <path d="M116.992 9.31618H112.738V29.5078H116.992V9.31618Z" fill="white"></path>
            <path
              d="M86.3587 8.50776C84.9055 13.2525 85.5599 18.7864 88.0526 24.0028H92.884C90.1026 19.2195 89.1401 13.9551 90.4298 9.74928C90.8918 8.22865 91.6328 6.95825 92.5952 5.98621C93.702 4.87942 95.2515 4.34046 96.8203 4.34046V0.0865479H75.2139V4.34046H88.4087C87.5329 5.54349 86.8303 6.92938 86.3491 8.49813L86.3587 8.50776Z"
              fill="white"
            ></path>
          </svg>
        </div>
        <nav className="navpill">
          <Link to="/" data-editor-id="global__nav-home">
            בית
          </Link>
          <Link to="/about" data-editor-id="global__nav-about">
            אודות והשיטה
          </Link>
          <Link to="/projects" data-editor-id="global__nav-projects">
            פרויקטים
          </Link>
          <a href="#" data-editor-id="global__nav-testimonials">
            לקוחות ממליצים
          </a>
          <Link to="/contact" className="navpill-contact" data-editor-id="global__nav-contact">
            צור קשר
          </Link>
        </nav>
        <div className="topbtn-wrap">
          <div data-editor-move-wrap="global__top-cta" style={{ display: "block" }}>
            <a href="#" className="topbtn" data-editor-id="global__top-cta">
              <span className="topbtn-txt">
                <span className="tb-bold">קוד פתוח:</span>
                <br />
                המדריך להורדה
              </span>
              <span className="topbtn-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="23.9561"
                    cy="23.9561"
                    r="23.3534"
                    fill="#DD4041"
                    stroke="white"
                    strokeWidth="1.20534"
                  ></circle>
                  <line
                    x1="11.1149"
                    y1="23.8643"
                    x2="36.7637"
                    y2="23.8643"
                    stroke="white"
                    strokeWidth="1.20985"
                  ></line>
                  <path
                    d="M19.0981 16C18.6142 18.5407 16.3155 23.864 10.9921 23.864"
                    stroke="white"
                    strokeWidth="1.45182"
                  ></path>
                  <path
                    d="M19.0981 31.8491C18.6142 29.3084 16.3155 23.9851 10.9921 23.9851"
                    stroke="white"
                    strokeWidth="1.45182"
                  ></path>
                </svg>
              </span>
            </a>
          </div>
        </div>
        <button
          className="hamburger"
          aria-label="תפריט"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>
      <div className={mobileMenuOpen ? "mobile-menu open" : "mobile-menu"}>
        <button className="mobile-close" aria-label="סגור" onClick={() => setMobileMenuOpen(false)}>
          ✕
        </button>
        <Link to="/" onClick={() => setMobileMenuOpen(false)}>
          בית
        </Link>
        <Link to="/about" onClick={() => setMobileMenuOpen(false)}>
          אודות והשיטה
        </Link>
        <Link to="/projects" onClick={() => setMobileMenuOpen(false)}>
          פרויקטים
        </Link>
        <a href="#" onClick={() => setMobileMenuOpen(false)}>
          לקוחות ממליצים
        </a>
        <Link to="/contact" className="navpill-contact" onClick={() => setMobileMenuOpen(false)}>
          צור קשר
        </Link>
      </div>

      {state.status === "ready" ? (
        <main className="pm-main">
          {/* HERO — State A full-bleed, shrinks to State B on scroll */}
          <div className="pm-hero-zone" id="pmHeroZone">
            <div className="pm-hero-sticky">
              <div className="pm-hero-box" id="pmHeroBox">
                <img
                  src={state.project.hero_image_url ?? ""}
                  alt={state.project.hero_image_alt ?? ""}
                  data-editor-id={eid("hero-image")}
                />
                <div className="pm-hero-overlay" id="pmHeroOverlay"></div>
                <div className="pm-hero-text" id="pmHeroText">
                  <p className="pm-hero-title" data-editor-id={eid("hero-title")}>
                    {state.project.title}
                  </p>
                  <p className="pm-hero-desc" data-editor-id={eid("hero-desc")}>
                    {state.project.tagline}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* האתגר */}
          <section className="pm-band" style={{ height: "calc(426*var(--s))" }}>
            <h2
              className="pm-t is-bold"
              style={{ "--fs": 45, "--iy": 14, "--rx": 1037 } as React.CSSProperties}
              data-editor-id={eid("challenge-heading")}
            >
              האתגר
            </h2>
            <p
              className="pm-t"
              style={
                {
                  "--fs": 30,
                  "--lh": 1.1111,
                  "--iy": 56.5,
                  "--rx": 1037,
                  whiteSpace: "pre-line",
                } as React.CSSProperties
              }
              data-editor-id={eid("challenge-text")}
            >
              {state.project.challenge_text}
            </p>
            <p
              className="pm-t"
              style={{ "--fs": 96.108, "--iy": 41, "--rx": 1589 } as React.CSSProperties}
              data-editor-id={eid("challenge-wordmark-1")}
            >
              פרשת
            </p>
            <div
              className="pm-box"
              style={{ "--x": 1253, "--y": 72.5, "--w": 57, "--h": 23 } as React.CSSProperties}
              aria-hidden="true"
              data-editor-id={eid("challenge-wordmark-icon")}
            >
              <img
                src="/Group 168.svg"
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                }}
              />
            </div>
            <div
              className="pm-box pm-fill-blue"
              style={
                {
                  "--x": 1225,
                  "--y": 105.5,
                  "--w": 392,
                  "--h": 92,
                  "--r": 60.632,
                } as React.CSSProperties
              }
            ></div>
            <div
              className="pm-box pm-fill-red pm-pulse-dot"
              style={
                {
                  "--x": 1256,
                  "--y": 130.5,
                  "--w": 48.411,
                  "--h": 48.411,
                  "--r": 24.3,
                } as React.CSSProperties
              }
            ></div>
            <p
              className="pm-t is-white"
              style={{ "--fs": 96.108, "--iy": 126, "--rx": 1588 } as React.CSSProperties}
              data-editor-id={eid("challenge-wordmark-2")}
            >
              דרכים
            </p>
          </section>

          {/* Main gallery slot 0 — wide parallax image */}
          {mainImages[0] && (
            <div
              className="pm-parallax-box"
              role="img"
              aria-label={mainImages[0].alt_text ?? ""}
              data-editor-id={eid("main-gallery-image-0")}
              style={{ backgroundImage: `url(${mainImages[0].image_url})` }}
            ></div>
          )}

          {/* הפתרון */}
          <section className="pm-band" style={{ height: "calc(513*var(--s))" }}>
            <h2
              className="pm-t is-bold"
              style={{ "--fs": 45, "--iy": 14, "--rx": 1037 } as React.CSSProperties}
              data-editor-id={eid("solution-heading")}
            >
              הפתרון
            </h2>
            <p
              className="pm-t"
              style={
                {
                  "--fs": 30,
                  "--lh": 1.1111,
                  "--iy": 65.5,
                  "--rx": 1037,
                  whiteSpace: "pre-line",
                } as React.CSSProperties
              }
              data-editor-id={eid("solution-text")}
            >
              {state.project.solution_text}
            </p>
            <p
              className="pm-t"
              style={{ "--fs": 110, "--iy": 97, "--rx": 1595 } as React.CSSProperties}
              data-editor-id={eid("solution-wordmark-1")}
            >
              נקודת
            </p>
            <div
              className="pm-box pm-outline-red"
              style={{ "--x": 1225, "--y": 77, "--w": 83.43, "--h": 83.43 } as React.CSSProperties}
              aria-hidden="true"
              data-editor-id={eid("solution-icon")}
            >
              <span className="pm-glyph" style={{ inset: "23%" }}>
                <svg viewBox="0 0 32 31" fill="none">
                  <path d="M20.9549 2H2.00001V20.9756" stroke="#E14E50" strokeWidth="4"></path>
                  <path
                    d="M1.75078 1.77246L30.3279 29.3771"
                    stroke="#E14E50"
                    strokeWidth="4"
                  ></path>
                </svg>
              </span>
            </div>
            <div
              className="pm-box pm-outline"
              style={{ "--x": 1225, "--y": 174, "--w": 369, "--h": 119 } as React.CSSProperties}
            ></div>
            <p
              className="pm-t is-bold is-center"
              style={{ "--fs": 110, "--iy": 206, "--cx": 1413 } as React.CSSProperties}
              data-editor-id={eid("solution-wordmark-2")}
            >
              המפנה
            </p>
          </section>

          {/* Main gallery slots 1+2 — image pair */}
          {(mainImages[1] || mainImages[2]) && (
            <section className="pm-band" style={{ height: "calc(566*var(--s))" }}>
              {mainImages[1] && (
                <div
                  className="pm-box pm-card"
                  style={
                    {
                      "--x": 57,
                      "--y": 0,
                      "--w": 877,
                      "--h": 518,
                      "--r": 23.271,
                    } as React.CSSProperties
                  }
                  data-editor-id={eid("main-gallery-image-1")}
                >
                  <img src={mainImages[1].image_url} alt={mainImages[1].alt_text ?? ""} />
                </div>
              )}
              {mainImages[2] && (
                <div
                  className="pm-box pm-card"
                  style={
                    {
                      "--x": 978,
                      "--y": 0,
                      "--w": 884,
                      "--h": 518,
                      "--r": 23.271,
                    } as React.CSSProperties
                  }
                  data-editor-id={eid("main-gallery-image-2")}
                >
                  <img
                    src={mainImages[2].image_url}
                    alt={mainImages[2].alt_text ?? ""}
                    style={{ objectPosition: "center 60%" }}
                  />
                </div>
              )}
            </section>
          )}

          {/* Main gallery slot 3 — second wide image */}
          {mainImages[3] && (
            <section className="pm-band" style={{ height: "calc(635*var(--s))" }}>
              <div
                className="pm-box pm-card"
                style={
                  {
                    "--x": 57,
                    "--y": 0,
                    "--w": 1805,
                    "--h": 590,
                    "--r": 23.271,
                  } as React.CSSProperties
                }
                data-editor-id={eid("main-gallery-image-3")}
              >
                <img src={mainImages[3].image_url} alt={mainImages[3].alt_text ?? ""} />
              </div>
            </section>
          )}

          {/* Brand colour gallery — real uploaded images, shown as-is (no CSS-only fallback color). */}
          {brandImages.length > 0 && (
            <section className="pm-band" style={{ height: "calc(474*var(--s))" }}>
              {[0, 1, 2].map((i) => {
                const img = brandImages[i];
                if (!img) return null;
                const x = [58, 663, 1268][i];
                return (
                  <div
                    key={img.id}
                    className="pm-box pm-card"
                    style={
                      {
                        "--x": x,
                        "--y": 0,
                        "--w": i === 0 ? 586 : 594,
                        "--h": 271,
                        "--r": 23.271,
                      } as React.CSSProperties
                    }
                    data-editor-id={eid(`brand-color-${i}`)}
                  >
                    <img src={img.image_url} alt={img.alt_text ?? ""} />
                  </div>
                );
              })}
            </section>
          )}

          {/* כותרת מתאימה — normal flow, not .pm-t absolute positioning: that
              system assumes fixed-length, manually line-broken text and
              overlaps as soon as either field is longer than the original
              design's placeholder. This section alone uses its own flex
              layout (pm-subtitle-*, in project-detail.css) sized by content;
              no other section on the page is touched. */}
          <section className="pm-subtitle-band">
            <div className="pm-subtitle-row">
              <h2 className="pm-subtitle-heading" data-editor-id={eid("subtitle-heading")}>
                {state.project.subtitle}
              </h2>
              <p className="pm-subtitle-text" data-editor-id={eid("subtitle-text")}>
                {state.project.extra_paragraph}
              </p>
            </div>
          </section>

          {/* Secondary gallery slot 0 — wide image */}
          {secondaryImages[0] && (
            <section className="pm-band" style={{ height: "calc(636*var(--s))" }}>
              <div
                className="pm-box pm-card"
                style={
                  {
                    "--x": 57,
                    "--y": 0,
                    "--w": 1805,
                    "--h": 590,
                    "--r": 23.271,
                  } as React.CSSProperties
                }
                data-editor-id={eid("secondary-gallery-image-0")}
              >
                <img src={secondaryImages[0].image_url} alt={secondaryImages[0].alt_text ?? ""} />
              </div>
            </section>
          )}

          {/* Secondary gallery slot 1 — tall image */}
          {secondaryImages[1] && (
            <section className="pm-band" style={{ height: "calc(864*var(--s))" }}>
              <div
                className="pm-box pm-card"
                style={
                  {
                    "--x": 57,
                    "--y": 0,
                    "--w": 1805,
                    "--h": 819,
                    "--r": 23.271,
                  } as React.CSSProperties
                }
                data-editor-id={eid("secondary-gallery-image-1")}
              >
                <img
                  src={secondaryImages[1].image_url}
                  alt={secondaryImages[1].alt_text ?? ""}
                  style={{
                    position: "absolute",
                    width: "104.1551%",
                    height: "auto",
                    left: "-0.1108%",
                    top: "-27.3504%",
                  }}
                />
              </div>
            </section>
          )}

          {/* Secondary gallery slots 2+3 — last pair, slot 3 gets the scroll-expand effect */}
          {(secondaryImages[2] || secondaryImages[3]) && (
            <section className="pm-band" style={{ height: "calc(798*var(--s))" }}>
              {secondaryImages[2] && (
                <div
                  className="pm-box pm-card"
                  style={
                    {
                      "--x": 57,
                      "--y": 0,
                      "--w": 884,
                      "--h": 518,
                      "--r": 23.271,
                    } as React.CSSProperties
                  }
                  data-editor-id={eid("secondary-gallery-image-2")}
                >
                  <img src={secondaryImages[2].image_url} alt={secondaryImages[2].alt_text ?? ""} />
                </div>
              )}
              {secondaryImages[3] && (
                <div
                  className="pm-box pm-card"
                  id="pmLastImgBox"
                  style={
                    {
                      "--x": 978,
                      "--y": 0,
                      "--w": 884,
                      "--h": 518,
                      "--r": 23.271,
                    } as React.CSSProperties
                  }
                  data-editor-id={eid("secondary-gallery-image-3")}
                >
                  <img src={secondaryImages[3].image_url} alt={secondaryImages[3].alt_text ?? ""} />
                </div>
              )}
            </section>
          )}

          {/* Scroll-progress spacer + fullscreen clone for secondary-gallery slot 3 above.
              No data-editor-id here on purpose — this clone is never the element the visual
              editor should target, only the original above is. */}
          <div className="pm-expand-track" id="pmExpandTrack" aria-hidden="true"></div>
          <div className="pm-expand-clone" id="pmExpandClone" aria-hidden="true">
            <img id="pmExpandCloneImg" src={secondaryImages[3]?.image_url ?? ""} alt="" />
          </div>

          {/* התוצאה בשטח */}
          <section
            className="pm-band"
            id="pmResultsSection"
            style={{ height: "calc(430*var(--s))" }}
          >
            <div
              className="pm-box pm-outline"
              style={
                { "--x": 1097, "--y": 0, "--w": 439, "--h": 119, "--r": 225 } as React.CSSProperties
              }
            ></div>
            <p
              className="pm-t is-center"
              style={{ "--fs": 110, "--iy": 37, "--cx": 1320.5 } as React.CSSProperties}
              data-editor-id={eid("result-heading-1")}
            >
              התוצאה
            </p>
            <div
              className="pm-box pm-outline"
              style={
                {
                  "--x": 1097,
                  "--y": 118,
                  "--w": 439,
                  "--h": 119,
                  "--r": 225,
                } as React.CSSProperties
              }
            ></div>
            <div
              className="pm-box pm-outline"
              style={
                {
                  "--x": 1097,
                  "--y": 120,
                  "--w": 116,
                  "--h": 113.4,
                  "--r": 58,
                } as React.CSSProperties
              }
              aria-hidden="true"
              data-editor-id={eid("result-icon")}
            >
              <span className="pm-glyph pm-spin" style={{ inset: "26%" }}>
                <img
                  src="/result-star.svg"
                  alt=""
                  style={{ width: "100%", height: "100%", display: "block" }}
                />
              </span>
            </div>
            <p
              className="pm-t is-center"
              style={{ "--fs": 110, "--iy": 152.5, "--cx": 1374 } as React.CSSProperties}
              data-editor-id={eid("result-heading-2")}
            >
              בשטח
            </p>
            <p
              className="pm-t"
              style={
                {
                  "--fs": 30,
                  "--lh": 1.1111,
                  "--iy": 25.5,
                  "--rx": 960,
                  whiteSpace: "pre-line",
                } as React.CSSProperties
              }
              data-editor-id={eid("result-text")}
            >
              {state.project.result_text}
            </p>
          </section>

          {/* Testimonial — card grows for long quotes, bottom decoration never stretches */}
          <section style={{ padding: "calc(50*var(--s)) 0 calc(100*var(--s))" }}>
            <div className="pm-quote-card">
              <p className="pm-quote-text" data-editor-id={eid("testimonial-text")}>
                {state.project.testimonial_text}
              </p>
              <div className="pm-quote-decor" aria-hidden="true">
                <img
                  src="/project-maalot/quote-card-shape.svg"
                  alt=""
                  className="pm-quote-decor-shape"
                />
                <div className="pm-quote-circle" data-editor-id={eid("testimonial-circle")}></div>
                <span className="pm-quote-mark" data-editor-id={eid("testimonial-quote-mark")}>
                  ״
                </span>
              </div>
            </div>
          </section>

          {/* Prev / next project nav */}
          {(state.adjacent.prev || state.adjacent.next) && (
            <section className="pm-band" id="pmProjectNav" style={{ height: "calc(285*var(--s))" }}>
              {state.adjacent.prev && (
                <div
                  className="pm-box pm-ring"
                  style={
                    {
                      "--x": 226,
                      "--y": 26,
                      "--w": 98,
                      "--h": 98,
                      "--r": 49,
                    } as React.CSSProperties
                  }
                  aria-hidden="true"
                  data-editor-id={eid("nav-prev-ring")}
                >
                  <span className="pm-glyph" style={{ inset: "27%" }}>
                    <svg viewBox="0 0 44 30" fill="none">
                      <path d="M43 15H3" stroke="#133551" strokeWidth="3" />
                      <path d="M14 4L3 15L14 26" stroke="#133551" strokeWidth="3" />
                    </svg>
                  </span>
                </div>
              )}
              {state.adjacent.prev && (
                <AdjacentNavLink
                  project={state.adjacent.prev}
                  className="pm-t pm-navlink is-left"
                  style={
                    { "--fs": 50, "--lh": 1.1222, "--iy": 34, "--lx": 360 } as React.CSSProperties
                  }
                  dataEditorId={eid("nav-prev-link")}
                  onAdjacentNavigate={onAdjacentNavigate}
                />
              )}
              {state.adjacent.next && (
                <AdjacentNavLink
                  project={state.adjacent.next}
                  className="pm-t pm-navlink"
                  style={
                    { "--fs": 50, "--lh": 1.1222, "--iy": 47, "--rx": 1564 } as React.CSSProperties
                  }
                  dataEditorId={eid("nav-next-link")}
                  onAdjacentNavigate={onAdjacentNavigate}
                />
              )}
              {state.adjacent.next && (
                <div
                  className="pm-box pm-ring"
                  style={
                    {
                      "--x": 1589,
                      "--y": 26,
                      "--w": 98,
                      "--h": 98,
                      "--r": 49,
                    } as React.CSSProperties
                  }
                  aria-hidden="true"
                  data-editor-id={eid("nav-next-ring")}
                >
                  <span className="pm-glyph" style={{ inset: "27%" }}>
                    <svg viewBox="0 0 44 30" fill="none">
                      <path d="M1 15H41" stroke="#133551" strokeWidth="3" />
                      <path d="M30 4L41 15L30 26" stroke="#133551" strokeWidth="3" />
                    </svg>
                  </span>
                </div>
              )}
            </section>
          )}
        </main>
      ) : (
        <>
          <div className="pm-notfound" hidden={state.status === "loading"}>
            <div className="pm-notfound-inner">
              <p className="pm-notfound-title">הפרויקט לא נמצא</p>
              <p className="pm-notfound-text">ייתכן שהקישור שגוי או שהפרויקט הוסר.</p>
              <Link to="/" className="pm-notfound-link">
                חזרה לדף הבית
              </Link>
            </div>
          </div>
          {state.status === "loading" && (
            <div className="pm-notfound">
              <div className="pm-notfound-inner">
                <p className="pm-notfound-text">טוען...</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* === Footer section + Bottom Bar — verbatim, copied from TurningPointAbout.tsx (shared global chrome) === */}
      <section className="footer-section">
        <div className="footer-top-badge">
          <svg
            className="footer-badge-icon"
            viewBox="0 0 241 263"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              cx="100.5"
              cy="102.751"
              r="77.5"
              fill="white"
              stroke="#E14E50"
              strokeWidth="4"
            ></circle>
            <path
              className="footer-badge-star"
              d="M65.4396 139.546L75.3339 146.181L98.4879 111.461L123.147 144.856L132.468 137.735L106.555 105.299L146.321 91.9533L142.342 80.7993L103.397 95.2206L103.028 53.49L91.0749 53.8214L93.1621 95.9428L52.8927 82.9894L49.609 94.2979L89.7737 105.628L65.4396 139.546Z"
              fill="#E14E50"
            ></path>
          </svg>
        </div>

        <div className="footer-inner">
          <div className="footer-content-col">
            <div className="footer-title-block">
              <div className="footer-heading-group">
                <div className="footer-heading-row">
                  <div
                    data-editor-move-wrap="global__footer-heading-text"
                    style={{ display: "block" }}
                  >
                    <span
                      className="footer-heading-text"
                      data-editor-id="global__footer-heading-text"
                    >
                      השלב הבא שלך
                    </span>
                  </div>
                  <img
                    src="/Group 82.svg"
                    className="footer-heading-icon"
                    data-editor-id="global__footer-heading-icon"
                    alt=""
                    aria-hidden="true"
                  />
                </div>
                <div className="footer-red-block">
                  <div data-editor-move-wrap="global__footer-red-text" style={{ display: "block" }}>
                    <span className="footer-red-text" data-editor-id="global__footer-red-text">
                      מתחיל כאן.
                    </span>
                  </div>
                </div>
              </div>

              <div data-editor-move-wrap="global__footer-desc" style={{ display: "block" }}>
                <p className="footer-desc" data-editor-id="global__footer-desc">
                  אם העסק שלך בפרשת דרכים והגעת למסקנה
                  <br />
                  שהגיע הזמן לנקודת מפנה אמיתית – בוא נדבר.
                </p>
              </div>
            </div>
          </div>

          <div className="footer-form-col">
            <form className="footer-form" name="contact" action="#">
              <div className="footer-form-row">
                <div className="footer-field">
                  <input
                    type="text"
                    name="name"
                    placeholder="שם"
                    className="footer-input"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="footer-field">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="טלפון"
                    className="footer-input"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>
              <div className="footer-field footer-field--full">
                <input
                  type="text"
                  name="situation"
                  placeholder="מהי פרשת הדרכים הנוכחית של העסק שלך?"
                  className="footer-input"
                  required
                />
              </div>
              <div
                data-editor-move-wrap="global__footer-submit-btn"
                style={{ alignSelf: "flex-end", width: "fit-content" }}
              >
                <button
                  type="submit"
                  className="about-cta footer-submit-btn"
                  data-editor-id="global__footer-submit-btn"
                >
                  <span className="acirc">
                    <svg viewBox="0 0 32 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.9549 2H2.00001V20.9756" stroke="white" strokeWidth="4"></path>
                      <path
                        d="M1.75078 1.77246L30.3279 29.3771"
                        stroke="white"
                        strokeWidth="4"
                      ></path>
                    </svg>
                  </span>
                  <span className="cta-text">שליחה</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="bottom-bar">
        <div className="bottom-bar-inner">
          <div data-editor-move-wrap="global__bottom-bar-copyright" style={{ display: "block" }}>
            <p className="bottom-bar-text" data-editor-id="global__bottom-bar-copyright">
              © כל הזכויות שמורות 2026
            </p>
          </div>
          <div data-editor-move-wrap="global__bottom-bar-credits" style={{ display: "block" }}>
            <p className="bottom-bar-text" data-editor-id="global__bottom-bar-credits">
              עיצוב: רות בנדיקט | פיתוח: חיה פוגל Csite
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
