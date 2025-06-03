import { HeadFC, PageProps } from "gatsby";
import * as React from "react";
import {
  BrandNameGeneratorSection,
  HomePageHero,
} from "../components/sections/";

const IndexPage: React.FC<PageProps> = () => {
  return (
    <>
      <HomePageHero />
      <BrandNameGeneratorSection />
    </>
  );
};

export const Head: HeadFC = (_props) => (
  <>
    <title>
      Brand Boffin | Instant AI Brand Idea Generator and Domain Name Search
    </title>
    <meta
      name="description"
      content="Find the perfect brand identity and domain names with Brand Boffin with AI-powered suggestions."
    />
  </>
);

export default IndexPage;
