import { HeadFC, PageProps } from "gatsby";
import * as React from "react";
import {
  BrandNameGeneratorSection,
  DomainAvailability,
  HomePageHero,
} from "../components/sections/";

const IndexPage: React.FC<PageProps> = () => {
  return (
    <>
      <HomePageHero />
      <DomainAvailability />
      <BrandNameGeneratorSection />
    </>
  );
};

export const Head: HeadFC = (props) => (
  <>
    <title>
      Brand Boffin | Instant AI Brand Idea Generator and Domain Name Search
    </title>
    <meta
      name="description"
      content="Find the perfect domain name and brand identity with Brand Boffin. Instant availability checks, brand name ideas, and top-level domain suggestions."
    />
  </>
);

export default IndexPage;
