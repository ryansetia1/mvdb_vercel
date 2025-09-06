import { useState } from 'react'
import { SearchableComboBox, useComboBoxOptions, ComboBoxOption } from './ui/searchable-combobox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

// Sample data for demo
const sampleActresses = [
  { id: '1', name: 'Yui Hatano', jpname: '波多野結衣', alias: 'Yui' },
  { id: '2', name: 'Ai Uehara', jpname: '上原亜衣', alias: 'Ai-chan' },
  { id: '3', name: 'Miku Ohashi', jpname: '大橋未久', alias: 'Miku' },
  { id: '4', name: 'Rion Nishikawa', jpname: '西川りおん', alias: 'Rion' },
  { id: '5', name: 'Akiho Yoshizawa', jpname: '吉沢明歩', alias: 'Akiho' },
  { id: '6', name: 'Maria Ozawa', jpname: '小澤マリア', alias: 'Maria' },
  { id: '7', name: 'Sora Aoi', jpname: '蒼井そら', alias: 'Sora' },
  { id: '8', name: 'Anri Okita', jpname: '沖田杏梨', alias: 'Anri' },
  { id: '9', name: 'Hibiki Otsuki', jpname: '大槻ひびき', alias: 'Hibiki' },
  { id: '10', name: 'Tina Yuzuki', jpname: '柚木ティナ', alias: 'Tina' },
]

const sampleCountries = [
  { code: 'US', name: 'United States', continent: 'North America' },
  { code: 'JP', name: 'Japan', continent: 'Asia' },
  { code: 'UK', name: 'United Kingdom', continent: 'Europe' },
  { code: 'DE', name: 'Germany', continent: 'Europe' },
  { code: 'FR', name: 'France', continent: 'Europe' },
  { code: 'CA', name: 'Canada', continent: 'North America' },
  { code: 'AU', name: 'Australia', continent: 'Oceania' },
  { code: 'BR', name: 'Brazil', continent: 'South America' },
  { code: 'IN', name: 'India', continent: 'Asia' },
  { code: 'CN', name: 'China', continent: 'Asia' },
]

export function SearchableComboBoxDemo() {
  const [selectedActress, setSelectedActress] = useState<string>('')
  const [selectedCountry, setSelectedCountry] = useState<string>('')

  // Create options using the hook for actresses
  const actressOptions = useComboBoxOptions(
    sampleActresses,
    (actress) => actress.id,
    (actress) => `${actress.name}${actress.jpname ? ` (${actress.jpname})` : ''}`,
    (actress) => [actress.name, actress.jpname, actress.alias].filter(Boolean)
  )

  // Create options manually for countries
  const countryOptions: ComboBoxOption[] = sampleCountries.map(country => ({
    value: country.code,
    label: `${country.name} (${country.code})`,
    searchTerms: [country.name, country.code, country.continent]
  }))

  const selectedActressData = sampleActresses.find(a => a.id === selectedActress)
  const selectedCountryData = sampleCountries.find(c => c.code === selectedCountry)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Searchable ComboBox Demo</h1>
        <p className="text-muted-foreground">
          Demo of searchable combo boxes with different data types and search strategies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Actress Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🎭</span>
              Actress Selector
            </CardTitle>
            <CardDescription>
              Search by name, Japanese name, or alias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Actress</label>
              <SearchableComboBox
                options={actressOptions}
                value={selectedActress}
                onValueChange={setSelectedActress}
                placeholder="Select an actress..."
                searchPlaceholder="Search by name, Japanese name, or alias..."
                emptyMessage="No actress found."
              />
            </div>
            
            {selectedActressData && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium">{selectedActressData.name}</h4>
                {selectedActressData.jpname && (
                  <p className="text-sm text-muted-foreground">{selectedActressData.jpname}</p>
                )}
                {selectedActressData.alias && (
                  <Badge variant="secondary" className="mt-1">{selectedActressData.alias}</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Country Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🌍</span>
              Country Selector
            </CardTitle>
            <CardDescription>
              Search by country name, code, or continent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Country</label>
              <SearchableComboBox
                options={countryOptions}
                value={selectedCountry}
                onValueChange={setSelectedCountry}
                placeholder="Select a country..."
                searchPlaceholder="Search by name, code, or continent..."
                emptyMessage="No country found."
              />
            </div>
            
            {selectedCountryData && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium">{selectedCountryData.name}</h4>
                <p className="text-sm text-muted-foreground">Code: {selectedCountryData.code}</p>
                <Badge variant="outline" className="mt-1">{selectedCountryData.continent}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>• Type to search through options instantly</li>
            <li>• Search works on multiple fields (name, alias, etc.)</li>
            <li>• Use arrow keys to navigate options</li>
            <li>• Press Enter to select, Escape to close</li>
            <li>• Click outside to close the dropdown</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}