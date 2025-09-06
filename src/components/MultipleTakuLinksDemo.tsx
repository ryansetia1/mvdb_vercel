import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { MultipleTakuLinksEnhanced } from './MultipleTakuLinksEnhanced'
import { Badge } from './ui/badge'

export function MultipleTakuLinksDemo() {
  // Sample test cases with different formats
  const [testCases] = useState([
    {
      name: 'Single Link',
      input: 'https://example.com/profile/actress1'
    },
    {
      name: 'Multiple Links (Space separated)',
      input: 'https://example.com/profile1 https://another-site.com/actress www.thirdsite.org/profile'
    },
    {
      name: 'Multiple Links (Comma separated)',  
      input: 'https://site1.com/profile, https://site2.com/actress, www.site3.com/gallery'
    },
    {
      name: 'Multiple Links (Mixed separators)',
      input: 'https://example.com/profile1\nhttps://another-site.com/actress; www.thirdsite.org/profile, https://fourthsite.net/gallery'
    },
    {
      name: 'Multiple Links (Newline separated)',
      input: `https://site1.com/profile
https://site2.com/actress  
www.site3.com/gallery
https://site4.com/photos`
    }
  ])

  const [customInput, setCustomInput] = useState('')

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Multiple Taku Links Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Cases */}
          <div className="space-y-4">
            <h3 className="font-medium">Test Cases</h3>
            {testCases.map((testCase, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{testCase.name}</Badge>
                </div>
                
                <div className="text-sm text-muted-foreground font-mono bg-gray-50 p-2 rounded">
                  {testCase.input}
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Default Variant</Label>
                    <MultipleTakuLinksEnhanced 
                      takulinks={testCase.input} 
                      variant="default" 
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Compact Variant</Label>
                    <MultipleTakuLinksEnhanced 
                      takulinks={testCase.input} 
                      variant="compact" 
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Badges Variant</Label>
                    <MultipleTakuLinksEnhanced 
                      takulinks={testCase.input} 
                      variant="badges" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Input Testing */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-medium">Custom Input Testing</h3>
            
            <div>
              <Label htmlFor="custom-input">Enter your taku links (multiple formats supported)</Label>
              <Textarea
                id="custom-input"
                placeholder="Enter URLs separated by spaces, commas, semicolons, or newlines..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
            
            {customInput.trim() && (
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Default Variant</Label>
                  <MultipleTakuLinksEnhanced 
                    takulinks={customInput} 
                    variant="default" 
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Compact Variant</Label>
                  <MultipleTakuLinksEnhanced 
                    takulinks={customInput} 
                    variant="compact" 
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Badges Variant</Label>
                  <MultipleTakuLinksEnhanced 
                    takulinks={customInput} 
                    variant="badges" 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Usage Guidelines */}
          <div className="border-t pt-6 space-y-2">
            <h3 className="font-medium">Supported Formats</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Space separated: <code>url1 url2 url3</code></li>
              <li>• Comma separated: <code>url1, url2, url3</code></li>
              <li>• Semicolon separated: <code>url1; url2; url3</code></li>
              <li>• Newline separated: Multiple URLs on separate lines</li>
              <li>• Mixed separators: Any combination of the above</li>
              <li>• URLs can start with http://, https://, www., or just domain.com</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}