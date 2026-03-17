import { useMemo, useState } from 'react';
import { TOP_COMPANIES, TOP_COMPANIES_SNAPSHOT_DATE } from '../data/topCompaniesData';

function formatMarketCap(value) {
  return `$${value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}B`;
}

function TopCompaniesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('All');

  const countries = useMemo(() => {
    return ['All', ...new Set(TOP_COMPANIES.map((company) => company.country))];
  }, []);

  const filteredCompanies = useMemo(() => {
    return TOP_COMPANIES.filter((company) => {
      const matchesSearch =
        company.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCountry =
        countryFilter === 'All' || company.country === countryFilter;

      return matchesSearch && matchesCountry;
    });
  }, [searchTerm, countryFilter]);

  const largestCompany = TOP_COMPANIES[0];
  const countriesRepresented = new Set(TOP_COMPANIES.map((company) => company.country)).size;
  const industriesRepresented = new Set(TOP_COMPANIES.map((company) => company.industry)).size;

  return (
    <section className="section-card companies-page">
      <div className="companies-header">
        <div>
          <h2 style={{ margin: 0 }}>Top 20 Companies by Market Capitalisation</h2>
          <p className="companies-subtitle">
            Snapshot date: {TOP_COMPANIES_SNAPSHOT_DATE}. This page summarises the top 20
            companies in your dataset by rank, market cap, industry, founders or origin,
            and home country.
          </p>
        </div>
      </div>

      <div className="companies-summary-grid">
        <div className="companies-summary-card">
          <div className="companies-summary-label">Largest company</div>
          <div className="companies-summary-value">{largestCompany.company}</div>
          <div className="companies-summary-subtext">
            {formatMarketCap(largestCompany.marketCapBillions)}
          </div>
        </div>

        <div className="companies-summary-card">
          <div className="companies-summary-label">Companies tracked</div>
          <div className="companies-summary-value">{TOP_COMPANIES.length}</div>
          <div className="companies-summary-subtext">Global ranking snapshot</div>
        </div>

        <div className="companies-summary-card">
          <div className="companies-summary-label">Countries represented</div>
          <div className="companies-summary-value">{countriesRepresented}</div>
          <div className="companies-summary-subtext">Across the dataset</div>
        </div>

        <div className="companies-summary-card">
          <div className="companies-summary-label">Industry entries</div>
          <div className="companies-summary-value">{industriesRepresented}</div>
          <div className="companies-summary-subtext">Main industry labels</div>
        </div>
      </div>

      <div className="companies-toolbar">
        <input
          type="text"
          className="companies-search"
          placeholder="Search by company, ticker, or industry"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="companies-filter"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
        >
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      <div className="companies-results-note">
        Showing {filteredCompanies.length} of {TOP_COMPANIES.length} companies
      </div>

      <div className="companies-grid">
        {filteredCompanies.map((company) => (
          <article key={company.rank} className="company-card">
            <div className="company-card-top">
              <span className="company-rank">#{company.rank}</span>
              <span className="company-ticker">{company.ticker}</span>
            </div>

            <h3 className="company-name">{company.company}</h3>

            <div className="company-marketcap">
              {formatMarketCap(company.marketCapBillions)}
            </div>

            <div className="company-detail">
              <span className="company-detail-label">Industry</span>
              <span>{company.industry}</span>
            </div>

            <div className="company-detail">
              <span className="company-detail-label">Country</span>
              <span>{company.country}</span>
            </div>

            <div className="company-detail">
              <span className="company-detail-label">Founders / origin</span>
              <span>{company.founders}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TopCompaniesPage;