import { HeadFC, PageProps } from "gatsby";
import * as React from "react";
import {
  HomePageHero,
  DomainAvailability,
  DomainSuggestions,
  TLDPricing,
} from "../components/sections/";

const IndexPage: React.FC<PageProps> = () => {
  return (
    <>
      <HomePageHero colorScheme="blue" />
      <DomainAvailability colorScheme="purple" />
      <DomainSuggestions colorScheme="green" />
      <TLDPricing colorScheme="orange" />
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
