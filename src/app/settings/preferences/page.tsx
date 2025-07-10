
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Sun, Moon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { applyColorTheme } from '@/components/theme-provider';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light Mode', Icon: Sun },
  { value: 'dark', label: 'Dark Mode', Icon: Moon },
];

const FAVORITE_COLOR_OPTIONS = [
  { value: 'default', label: 'Default (Sky Blue)', color: '#87CEEB' },
  { value: 'pink', label: 'Playful Pink', color: '#F472B6' },
  { value: 'red', label: 'Sunset Red', color: '#E55C5C' },
  { value: 'green', label: 'Forest Green', color: '#4CAF50' },
  { value: 'blue', 'label': 'Oceanic Blue', color: '#3A8DDE' },
  { value: 'purple', label: 'Twilight Purple', color: '#9067C6' },
];


export default function PreferencesPage() {
    const [theme, setTheme] = useState<string>('light');
    const [favoriteColor, setFavoriteColor] = useState<string>('default');
    const { toast } = useToast();

    useEffect(() => {
        setTheme(localStorage.getItem('theme') || 'light');
        setFavoriteColor(localStorage.getItem('favoriteColor') || 'default');
    }, []);

    const handleThemeChange = async (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        toast({ title: "Theme Changed", description: `Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode.` });
    };

    const handleFavoriteColorChange = async (newColor: string) => {
        setFavoriteColor(newColor);
        localStorage.setItem('favoriteColor', newColor);
        applyColorTheme(newColor);
        toast({ title: "Favorite Color Set", description: `Your favorite color is now ${FAVORITE_COLOR_OPTIONS.find(c => c.value === newColor)?.label || newColor}.` });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle>Theme &amp; Preferences</CardTitle>
                <CardDescription>Customize your Shravya Playhouse experience. These settings are saved in your browser.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                <div className="space-y-3">
                    <Label className="text-lg font-medium flex items-center">
                    <Palette className="mr-2 h-5 w-5 text-primary" /> App Theme
                    </Label>
                    <RadioGroup
                    value={theme}
                    onValueChange={handleThemeChange}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                    {THEME_OPTIONS.map((option) => (
                        <Label
                        key={option.value}
                        htmlFor={`theme-${option.value}`}
                        className={cn(
                            "flex items-center space-x-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                            theme === option.value && "border-primary ring-2 ring-primary"
                        )}
                        >
                        <RadioGroupItem value={option.value} id={`theme-${option.value}`} className="sr-only peer" />
                        <option.Icon className="h-6 w-6 text-muted-foreground peer-checked:text-primary" />
                        <span className="font-medium peer-checked:text-primary">{option.label}</span>
                        </Label>
                    ))}
                    </RadioGroup>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="favoriteColor" className="text-lg font-medium flex items-center">
                    <Palette className="mr-2 h-5 w-5 text-primary" /> Favorite Color
                    </Label>
                    <Select value={favoriteColor} onValueChange={handleFavoriteColorChange}>
                    <SelectTrigger id="favoriteColor" className="w-full sm:w-[280px] text-base">
                        <SelectValue placeholder="Select a color" />
                    </SelectTrigger>
                    <SelectContent>
                        {FAVORITE_COLOR_OPTIONS.map((colorOption) => (
                        <SelectItem key={colorOption.value} value={colorOption.value} className="text-base">
                            <div className="flex items-center">
                            <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: colorOption.color }}></span>
                            {colorOption.label}
                            </div>
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                    This color preference will update your app's theme and be saved to your profile.
                    </p>
                </div>
                </CardContent>
            </Card>
        </div>
    );
}
